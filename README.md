# Climb Sefuri Project

背振ロング（佐賀）のヒルクライムチャレンジ「Climb Sefuri Project」の紹介サイト。
Vite + TypeScript（フレームワーク非依存の Vanilla TS）。4ビューのタブ切替 SPA。

## 開発

```bash
npm install
npm run dev      # http://localhost:5173
```

## ビルド

```bash
npm run build    # dist/ に出力（tsc の型チェック込み）
npm run preview  # ビルド結果をローカル確認
```

## デプロイ（GitHub 連携で自動デプロイ）

このリポジトリを Vercel / Netlify / Cloudflare Pages のいずれかに接続すると、
`main` への push ごとに自動でビルド・公開されます。ホスト側のビルド設定：

| 項目 | 値 |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 18 以上 |

いずれのホストも Vite を自動検出するため、通常は上記の入力すら不要です。

## Firebase（メンバーのリアルタイム同期）

メンバー登録・リザルトのリアルタイム共有は Firebase Realtime Database を使用します。
`src/firebase/config.ts` はプレースホルダー（`YOUR_API_KEY` 等）です。**未設定のままでも
ローカルのモックデータで全画面が動作します**が、複数端末での同期・永続化を行うには、
自分の Firebase プロジェクトの値に差し替えてください（認証なし・誰でも読み書き可の
セキュリティルールを前提）。

## 構成

```
src/
├── main.ts            # エントリ（シェル描画・ルーター初期化）
├── router.ts          # ハッシュルーティング + ビュー切替
├── views/             # home / ranks / members / join
├── components/        # emblem(defs) / sticker / meter / memberForm
├── background/        # particles（Canvas）
├── firebase/          # config / time / membersStore
├── data/              # tiers.json / tiers.ts / members.json
└── styles/            # tokens.css / base.css / components.css
```
