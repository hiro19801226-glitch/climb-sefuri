import { firebaseConfig } from "./config";

/**
 * Firebase App / Realtime Database を一度だけ初期化して使い回す。
 * members・events など複数ストアが initializeApp を重複実行して
 * "app already exists" エラーにならないよう getApps() でガードする。
 */
export async function getRtdb() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const database = await import("firebase/database");
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return {
    db: database.getDatabase(app),
    ref: database.ref,
    onValue: database.onValue,
    push: database.push,
    update: database.update,
    remove: database.remove,
  };
}
