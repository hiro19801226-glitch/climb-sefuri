import type { Attendee, CalEvent, EventRecord } from "../types";
import { isFirebaseConfigured } from "./config";
import { getRtdb } from "./db";

export type EventsListener = (events: CalEvent[]) => void;

/** Firebase 上の生の予定（attendees はネストされたオブジェクト） */
type StoredEvent = EventRecord & {
  attendees?: Record<string, { name: string; at: number }>;
};

function toAttendeeList(raw: StoredEvent["attendees"]): Attendee[] {
  if (!raw) return [];
  return Object.entries(raw)
    .map(([id, a]) => ({ id, name: a.name, at: a.at }))
    .sort((x, y) => x.at - y.at);
}

/** 日付の昇順（同日は登録順）で並べる */
export function sortEvents(events: CalEvent[]): CalEvent[] {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.updatedAt - b.updatedAt;
  });
}

export interface EventsStore {
  subscribe(listener: EventsListener): () => void;
  add(data: Omit<EventRecord, "updatedAt">): Promise<void>;
  update(id: string, data: Partial<Omit<EventRecord, "updatedAt">>): Promise<void>;
  remove(id: string): Promise<void>;
  /** 予定への参加表明（名前を追加） */
  join(eventId: string, name: string): Promise<void>;
  /** 参加表明の取り消し */
  leave(eventId: string, attendeeId: string): Promise<void>;
}

/** Firebase 未設定時のインメモリ・モック（UI 確認用） */
function createLocalMockStore(): EventsStore {
  let events: CalEvent[] = [];
  const listeners = new Set<EventsListener>();
  let nextId = 1;
  let nextAttId = 1;

  const emit = () => {
    const snapshot = sortEvents(events);
    listeners.forEach((cb) => cb(snapshot));
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(sortEvents(events));
      return () => listeners.delete(listener);
    },
    async add(data) {
      events = [...events, { ...data, id: `local-${nextId++}`, updatedAt: Date.now(), attendees: [] }];
      emit();
    },
    async update(id, data) {
      events = events.map((e) => (e.id === id ? { ...e, ...data, updatedAt: Date.now() } : e));
      emit();
    },
    async remove(id) {
      events = events.filter((e) => e.id !== id);
      emit();
    },
    async join(eventId, name) {
      events = events.map((e) =>
        e.id === eventId
          ? { ...e, attendees: [...e.attendees, { id: `a-${nextAttId++}`, name, at: Date.now() }] }
          : e
      );
      emit();
    },
    async leave(eventId, attendeeId) {
      events = events.map((e) =>
        e.id === eventId ? { ...e, attendees: e.attendees.filter((a) => a.id !== attendeeId) } : e
      );
      emit();
    },
  };
}

/** Firebase Realtime Database に接続する本番用ストア（認証なし・全員書き込み可） */
async function createFirebaseStore(): Promise<EventsStore> {
  const { db, ref, onValue, push, update, remove } = await getRtdb();
  const eventsRef = ref(db, "events");

  return {
    subscribe(listener) {
      return onValue(eventsRef, (snapshot) => {
        const value = (snapshot.val() ?? {}) as Record<string, StoredEvent>;
        const events: CalEvent[] = Object.entries(value).map(([id, rec]) => ({
          id,
          date: rec.date,
          title: rec.title,
          note: rec.note ?? null,
          updatedAt: rec.updatedAt,
          attendees: toAttendeeList(rec.attendees),
        }));
        listener(sortEvents(events));
      });
    },
    async add(data) {
      await push(eventsRef, { ...data, updatedAt: Date.now() });
    },
    async update(id, data) {
      await update(ref(db, `events/${id}`), { ...data, updatedAt: Date.now() });
    },
    async remove(id) {
      await remove(ref(db, `events/${id}`));
    },
    async join(eventId, name) {
      await push(ref(db, `events/${eventId}/attendees`), { name, at: Date.now() });
    },
    async leave(eventId, attendeeId) {
      await remove(ref(db, `events/${eventId}/attendees/${attendeeId}`));
    },
  };
}

let storePromise: Promise<EventsStore> | null = null;

export function getEventsStore(): Promise<EventsStore> {
  if (!storePromise) {
    storePromise = isFirebaseConfigured ? createFirebaseStore() : Promise.resolve(createLocalMockStore());
  }
  return storePromise;
}
