/**
 * Firebase Realtime Database 設定。
 * 実運用時は自分の Firebase プロジェクトの値に書き換えること。
 * データベースのセキュリティルールは要件どおり認証なし・全開放（read/write: true）を前提とする。
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAVUiqpU8_20nkwriiW-hPpB4ejeXuInL4",
  authDomain: "climb-sefuri.firebaseapp.com",
  databaseURL: "https://climb-sefuri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "climb-sefuri",
  storageBucket: "climb-sefuri.firebasestorage.app",
  messagingSenderId: "791020378646",
  appId: "1:791020378646:web:677f98df23980ba3c17337",
  measurementId: "G-0X8PF4WKGS",
};

/** プレースホルダーのままかどうか（未設定時はローカルモックストアで動作させる） */
export const isFirebaseConfigured = !Object.values(firebaseConfig).some((v) => v.startsWith("YOUR_"));

/**
 * Firebase App Check（reCAPTCHA v3）のサイトキー。
 * Firebaseコンソール → App Check → Webアプリ登録（プロバイダ: reCAPTCHA v3）で発行される値に置き換える。
 * reCAPTCHA v3のサイトキーはクライアント公開前提の値であり秘密ではない（apiKeyと同様コミットしてよい）。
 * プレースホルダーのままの間は App Check の初期化自体をスキップする（HANDOFF.md §4参照）。
 */
export const appCheckSiteKey = "YOUR_RECAPTCHA_V3_SITE_KEY";
export const isAppCheckConfigured = !appCheckSiteKey.startsWith("YOUR_");
