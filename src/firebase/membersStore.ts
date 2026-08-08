import type { Member, MemberRecord } from "../types";
import { mmssToSeconds } from "./time";
import { isFirebaseConfigured } from "./config";
import { getRtdb } from "./db";
import seedMembers from "../data/members.json";

export type MembersListener = (members: Member[]) => void;

/**
 * リザルトボードの並び替えルール（gemini-code-1783220486502.md §3-②）:
 *   1. result が入力済みのメンバーを優先し、速い順（総秒数の昇順）
 *   2. 未出走（result 未入力）は下にまとめる
 */
export function sortMembers(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    const secA = mmssToSeconds(a.result);
    const secB = mmssToSeconds(b.result);
    if (secA != null && secB != null) return secA - secB;
    if (secA != null) return -1;
    if (secB != null) return 1;
    return a.updatedAt - b.updatedAt;
  });
}

export interface MembersStore {
  subscribe(listener: MembersListener): () => void;
  add(data: Omit<MemberRecord, "updatedAt">): Promise<void>;
  update(id: string, data: Partial<Omit<MemberRecord, "updatedAt">>): Promise<void>;
  remove(id: string): Promise<void>;
}

/**
 * Firebase 未設定（config.ts がプレースホルダーのまま）の場合に使う、
 * インメモリのモックストア。本番同等の CRUD / 購読 API を提供し、
 * Firebase プロジェクトが無くても UI 全体を確認できるようにする。
 */
function createLocalMockStore(): MembersStore {
  let members: Member[] = (seedMembers as Member[]).map((m) => ({ ...m }));
  const listeners = new Set<MembersListener>();
  let nextId = 1;

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
      members = [...members, { ...data, id: `local-${nextId++}`, updatedAt: Date.now() }];
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
  };
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
        const value = (snapshot.val() ?? {}) as Record<string, MemberRecord>;
        const members: Member[] = Object.entries(value).map(([id, record]) => ({ id, ...record }));
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
  };
}

let storePromise: Promise<MembersStore> | null = null;

export function getMembersStore(): Promise<MembersStore> {
  if (!storePromise) {
    storePromise = isFirebaseConfigured ? createFirebaseStore() : Promise.resolve(createLocalMockStore());
  }
  return storePromise;
}
