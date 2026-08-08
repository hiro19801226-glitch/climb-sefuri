import type { Member, MemberRecord, RecordItem } from "../types";
import { mmssToSeconds } from "./time";
import { isFirebaseConfigured } from "./config";
import { getRtdb } from "./db";
import seedMembers from "../data/members.json";

export type MembersListener = (members: Member[]) => void;

/** Firebase 上の生メンバー（records はネストされたオブジェクト） */
type StoredMember = MemberRecord & {
  records?: Record<string, { date: string; time: string; note?: string | null; at: number }>;
};

/** 記録オブジェクト → 新しい日付順の配列 */
function toRecordList(raw: StoredMember["records"]): RecordItem[] {
  if (!raw) return [];
  return Object.entries(raw)
    .map(([id, r]) => ({ id, date: r.date, time: r.time, note: r.note ?? null, at: r.at }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.at - a.at));
}

/**
 * メンバーのベストタイム（総秒数）。
 * 記録があれば記録内の最速、無ければ従来の result（旧システムのベスト）を使う。
 */
export function memberBestSeconds(m: Member): number | null {
  if (m.records.length) {
    const secs = m.records
      .map((r) => mmssToSeconds(r.time))
      .filter((s): s is number => s != null);
    if (secs.length) return Math.min(...secs);
  }
  return mmssToSeconds(m.result);
}

/**
 * リーダーボードの並び替え：ベストタイムの速い順。未記録は下にまとめる。
 */
export function sortMembers(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    const secA = memberBestSeconds(a);
    const secB = memberBestSeconds(b);
    if (secA != null && secB != null) return secA - secB;
    if (secA != null) return -1;
    if (secB != null) return 1;
    return a.updatedAt - b.updatedAt;
  });
}

export interface RecordInput {
  date: string;
  time: string;
  note: string | null;
}

export interface MembersStore {
  subscribe(listener: MembersListener): () => void;
  add(data: Omit<MemberRecord, "updatedAt">): Promise<void>;
  update(id: string, data: Partial<Omit<MemberRecord, "updatedAt">>): Promise<void>;
  remove(id: string): Promise<void>;
  /** メンバーにタイム記録を追加 */
  addRecord(memberId: string, data: RecordInput): Promise<void>;
  /** タイム記録を削除 */
  removeRecord(memberId: string, recordId: string): Promise<void>;
}

/**
 * Firebase 未設定（config.ts がプレースホルダーのまま）の場合に使う、
 * インメモリのモックストア。本番同等の CRUD / 購読 API を提供し、
 * Firebase プロジェクトが無くても UI 全体を確認できるようにする。
 */
function createLocalMockStore(): MembersStore {
  let members: Member[] = (seedMembers as Array<Omit<Member, "records">>).map((m) => ({
    ...m,
    records: [],
  }));
  const listeners = new Set<MembersListener>();
  let nextId = 1;
  let nextRecId = 1;

  const emit = () => {
    const snapshot = sortMembers(members);
    listeners.forEach((cb) => cb(snapshot));
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(sortMembers(members));
      return () => listeners.delete(listener);
    },
    async add(data) {
      members = [...members, { ...data, id: `local-${nextId++}`, updatedAt: Date.now(), records: [] }];
      emit();
    },
    async update(id, data) {
      members = members.map((m) => (m.id === id ? { ...m, ...data, updatedAt: Date.now() } : m));
      emit();
    },
    async remove(id) {
      members = members.filter((m) => m.id !== id);
      emit();
    },
    async addRecord(memberId, data) {
      const rec: RecordItem = { ...data, id: `rec-${nextRecId++}`, at: Date.now() };
      members = members.map((m) =>
        m.id === memberId ? { ...m, records: toRecordList(recordsToRaw([...m.records, rec])) } : m
      );
      emit();
    },
    async removeRecord(memberId, recordId) {
      members = members.map((m) =>
        m.id === memberId ? { ...m, records: m.records.filter((r) => r.id !== recordId) } : m
      );
      emit();
    },
  };
}

/** RecordItem[] → 生オブジェクト（モックで toRecordList を再利用して並べ直すため） */
function recordsToRaw(list: RecordItem[]): StoredMember["records"] {
  const raw: NonNullable<StoredMember["records"]> = {};
  for (const r of list) raw[r.id] = { date: r.date, time: r.time, note: r.note, at: r.at };
  return raw;
}

/**
 * Firebase Realtime Database に接続する本番用ストア。
 * 認証は行わない（URL を知っていれば誰でも読み書き可能という要件どおり）。
 */
async function createFirebaseStore(): Promise<MembersStore> {
  const { db, ref, onValue, push, update, remove } = await getRtdb();
  const membersRef = ref(db, "members");

  return {
    subscribe(listener) {
      const unsubscribe = onValue(membersRef, (snapshot) => {
        const value = (snapshot.val() ?? {}) as Record<string, StoredMember>;
        const members: Member[] = Object.entries(value).map(([id, rec]) => ({
          id,
          name: rec.name,
          target: rec.target,
          result: rec.result ?? null,
          updatedAt: rec.updatedAt,
          records: toRecordList(rec.records),
        }));
        listener(sortMembers(members));
      });
      return unsubscribe;
    },
    async add(data) {
      await push(membersRef, { ...data, updatedAt: Date.now() });
    },
    async update(id, data) {
      await update(ref(db, `members/${id}`), { ...data, updatedAt: Date.now() });
    },
    async remove(id) {
      await remove(ref(db, `members/${id}`));
    },
    async addRecord(memberId, data) {
      await push(ref(db, `members/${memberId}/records`), { ...data, at: Date.now() });
    },
    async removeRecord(memberId, recordId) {
      await remove(ref(db, `members/${memberId}/records/${recordId}`));
    },
  };
}

let storePromise: Promise<MembersStore> | null = null;

export function getMembersStore(): Promise<MembersStore> {
  if (!storePromise) {
    storePromise = isFirebaseConfigured ? createFirebaseStore() : Promise.resolve(createLocalMockStore());
  }
  return storePromise;
}
