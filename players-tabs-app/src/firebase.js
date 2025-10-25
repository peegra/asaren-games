// Firebaseの初期化とFirestoreの設定を行います。

const firebaseConfig = {
  apiKey: "AIzaSyBm6PS6flmlf-v4UF_dWwcW7ZHyBha8pCg",
  authDomain: "asarenrandom.firebaseapp.com",
  projectId: "asarenrandom",
  storageBucket: "asarenrandom.appspot.com",
  messagingSenderId: "31279177547",
  appId: "1:31279177547:web:917bcc19663240be2152ce"
};

// 既に初期化されている場合は再初期化を避ける
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Firestoreの設定
const db = firebase.firestore();

// 他のスクリプトから利用できるようにグローバルへ公開
window.db = db;
