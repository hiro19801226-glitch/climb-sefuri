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
