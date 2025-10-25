# Players Tabs App

選手の登録と一覧表示をタブで切り替えられるウェブアプリケーションです。Firebase Firestoreを使用してデータを管理します。

## フォルダ構成

- `public/index.html` : アプリ全体のタブ UI と iframe を定義
- `public/registration.html` : 名前と学年（ボタン選択）で選手を登録
- `public/list.html` : 登録済み選手の一覧表示と削除ボタン
- `public/styles.css` : 共通スタイル（レスポンシブ対応）
- `src/firebase.js` : Firebase 初期化と Firestore 接続（グローバル公開）
- `src/registration.js` : 登録フォームの送信処理
- `src/list.js` : Firestore からの取得と削除処理
- `package.json` : 依存関係と npm スクリプト

## セットアップ

```bash
npm install
npm run start
```

`npm run start` で `live-server` が 127.0.0.1:8080 (または localhost:8080) で `public/` を配信します。ブラウザでアクセスして動作確認してください。

## 使用技術

- HTML / CSS / JavaScript
- Firebase Firestore (compat 版 SDK)

## ライセンス

MIT License
