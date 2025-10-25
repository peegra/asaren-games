# Players Tabs App

このプロジェクトは、選手の登録と一覧表示をタブで切り替えられるウェブアプリケーションです。Firebase Firestoreを使用してデータを管理します。

## ファイル構成

- `public/index.html`: アプリケーションのメインHTMLファイル。タブの構造を持ち、登録画面と一覧画面へのリンクを提供します。
- `public/registration.html`: 選手の登録画面を表示します。ユーザーが名前と学年を入力し、選手を追加するためのフォームを含みます。
- `public/list.html`: 選手の一覧を表示します。Firestoreから取得した選手の情報をリスト形式で表示します。
- `public/styles.css`: アプリケーションのスタイルシート。タブやフォームのスタイルを定義します。
- `src/app.js`: アプリケーションのエントリーポイント。タブの切り替え機能を実装し、登録画面と一覧画面を表示します。
- `src/registration.js`: 選手の登録機能を実装します。Firestoreに選手を追加するための関数を含みます。
- `src/list.js`: 選手の一覧を取得し、表示する機能を実装します。Firestoreからデータを取得し、リストに表示します。
- `src/firebase.js`: Firebaseの初期化とFirestoreの設定を行います。Firebaseの設定情報を含みます。
- `package.json`: npmの設定ファイル。依存関係やスクリプトをリストします。
- `.gitignore`: Gitで無視するファイルやフォルダを指定します。

## セットアップ手順

1. リポジトリをクローンします。
2. 必要な依存関係をインストールします。
   ```
   npm install
   ```
3. アプリケーションを起動します。
   ```
   npm start
   ```
4. ブラウザで `http://localhost:3000` にアクセスします。

## 使用技術

- HTML
- CSS
- JavaScript
- Firebase Firestore

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。