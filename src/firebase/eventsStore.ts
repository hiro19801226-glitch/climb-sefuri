import type { CalEvent, EventRecord } from "../types";
import { isFirebaseConfigured } from "./config";
import { getRtdb } from "./db";

export type EventsListener = (events: CalEvent[]) => void;

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
}

/** Firebase 未設定時のインメモリ・モック（UI 確認用） */
function createLocalMockStore(): EventsStore {
  let events: CalEvent[] = [];
  const listeners = new Set<EventsListener>();
  let nextId = 1;

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
      events = [...events, { ...data, id: `local-${nextId++}`, updatedAt: Date.now() }];
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
  };
}

/** Firebase Realtime Database に接続する本番用ストア（認証なし・全員書き込み可） */
async function createFirebaseStore(): Promise<EventsStore> {
  const { db, ref, onValue, push, update, remove } = await getRtdb();
  const eventsRef = ref(db, "events");

  return {
    subscribe(listener) {
      return onValue(eventsRef, (snapshot) => {
        const value = (snapshot.val() ?? {}) as Record<string, EventRecord>;
        const events: CalEvent[] = Object.entries(value).map(([id, record]) => ({ id, ...record }));
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
  };
}

let storePromise: Promise<EventsStore> | null = null;

export function getEventsStore(): Promise<EventsStore> {
  if (!storePromise) {
    storePromise = isFirebaseConfigured ? createFirebaseStore() : Promise.resolve(createLocalMockStore());
  }
  return storePromise;
}
