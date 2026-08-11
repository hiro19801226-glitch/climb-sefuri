import { firebaseConfig, appCheckSiteKey, isAppCheckConfigured } from "./config";

let appCheckInitialized = false;

/**
 * App Check を一度だけ初期化する。サイトキーが未設定（プレースホルダーのまま）なら何もしない
 * ＝ App Check 未設定でも従来どおり動作する（HANDOFF.md §4参照）。
 */
async function ensureAppCheck(app: import("firebase/app").FirebaseApp): Promise<void> {
  if (appCheckInitialized || !isAppCheckConfigured) return;
  appCheckInitialized = true;
  const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

/**
 * Firebase App / Realtime Database を一度だけ初期化して使い回す。
 * members・events など複数ストアが initializeApp を重複実行して
 * "app already exists" エラーにならないよう getApps() でガードする。
 */
export async function getRtdb() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const database = await import("firebase/database");
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  await ensureAppCheck(app);
  return {
    db: database.getDatabase(app),
    ref: database.ref,
    onValue: database.onValue,
    push: database.push,
    update: database.update,
    remove: database.remove,
  };
}
