/**
 * Firebase Realtime Database 設定。
 * 実運用時は自分の Firebase プロジェクトの値に書き換えること。
 * データベースのセキュリティルールは要件どおり認証なし・全開放（read/write: true）を前提とする。
 */
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

/** プレースホルダーのままかどうか（未設定時はローカルモックストアで動作させる） */
export const isFirebaseConfigured = !Object.values(firebaseConfig).some((v) => v.startsWith("YOUR_"));
