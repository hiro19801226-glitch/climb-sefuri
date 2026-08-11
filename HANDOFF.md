# Climb Sefuri Project — 引き継ぎ書

次のチャット／セッションが状況を把握して継続開発できるようにまとめた資料。
（最終更新時点の最新コミット: `e50c03a`、公開バンドル: `assets/index-e2ZP6qcs.js`）

---

## 1. 概要

- **プロダクト**: 背振ロング（佐賀）のヒルクライムチャレンジ「Climb Sefuri Project」紹介サイト＋メンバー機能
- **公開URL（本番）**: https://climb-sefuri.vercel.app
- **GitHubリポジトリ**: https://github.com/hiro19801226-glitch/climb-sefuri （public / default branch `main`）
- **ローカル作業パス**: `C:\Users\hiro1\OneDrive\デスクトップ\climb-sefuri`
- **ホスティング**: Vercel（`main` への push で自動デプロイ、約1分で反映）

---

## 2. 技術構成

- **Vite + TypeScript（Vanilla TS、フレームワーク不使用）**
- **Firebase Realtime Database**（リアルタイム同期・認証なし）
- フォント: Google Fonts（Oswald / Zen Kaku Gothic New）
- 画像: 称号ステッカーのみ実JPG（`src/assets/stickers/`）。その他はSVG/CSS

---

## 3. デプロイ手順（最重要）

ローカルで編集 → ビルド → commit → push で自動デプロイ。

```bash
cd "/c/Users/hiro1/OneDrive/デスクトップ/climb-sefuri"
export PATH="$PATH:/c/Program Files/nodejs"   # bash では Node の PATH を通す
npm run build                                  # tsc（型チェック）+ vite build
git add <変更ファイル>
git -c core.safecrlf=false commit -m "..."     # CRLF警告は無害
git push origin main                           # Vercel が自動ビルド＆公開
```

**本番反映の確認**: `dist/index.html` の `assets/index-*.js` ハッシュと、
`curl -s https://climb-sefuri.vercel.app/` のハッシュが一致すればデプロイ完了。

- コミットの `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` を末尾に付ける運用。
- git ユーザーはローカル設定（name: `hiro1` / email: `hiro19801226@gmail.com`）。
- **gh CLI 認証済み**（`hiro19801226-glitch`、keyring 保存）。`gh` の実体は `C:\Program Files\GitHub CLI\gh.exe`。

---

## 4. Firebase

- プロジェクト: `climb-sefuri`（Spark 無料プラン）
- Realtime Database リージョン: **asia-southeast1（シンガポール）**
- **databaseURL**: `https://climb-sefuri-default-rtdb.asia-southeast1.firebasedatabase.app`
- **セキュリティルール**: `{"rules":{".read":true,".write":true}}`（**認証なし・全公開**。仕様どおり誰でも読み書き削除可）
- 設定は `src/firebase/config.ts`（apiKey 等はクライアント公開前提の値なのでコミット済み・秘密ではない）
- `isFirebaseConfigured` が true のため、**開発サーバー（localhost）も本番と同じ Firebase に接続する** → テスト時は要注意（§10 参照）

### 4-1. セキュリティ強化（App Check + ルールバリデーション）— コンソール側の作業が未完了

「誰でも書き込める」仕様は維持したまま、`curl` 等でのDB直叩き・荒らしを防ぐための対策を追加中。
**クライアント側コードは実装済み**（`src/firebase/config.ts` の `appCheckSiteKey` / `isAppCheckConfigured`、
`src/firebase/db.ts` の `ensureAppCheck()`）だが、**Firebaseコンソール側の設定は未実施**。
サイトキーがプレースホルダー（`YOUR_RECAPTCHA_V3_SITE_KEY`）のままの間は App Check 初期化はスキップされ、
今までどおり動作する（壊れない）。

有効化するには次の3手順が必要（ログインが要るためユーザー自身が実施）:

1. Firebaseコンソール → プロジェクト `climb-sefuri` → **App Check** → Webアプリを登録 →
   プロバイダは **reCAPTCHA v3** を選択 → 発行された **サイトキー** を
   `src/firebase/config.ts` の `appCheckSiteKey` に貼り付けてビルド・デプロイ（§3の手順で push）。
2. App Check → **Realtime Database** → **「Enforce（強制）」を有効化**。
   → 有効なApp Checkトークンを持つ正規のWebアプリ以外からのリクエストは、`.read`/`.write`ルールに
   到達する前にブロックされる（＝`curl`等の直叩きを遮断）。反映まで数分〜最大1日ほどかかることがある。
3. Realtime Database → **ルール** タブに、以下のバリデーション強化ルールを貼り付けて公開。
   `.read`/`.write` は既存どおり `true` のまま維持し、書き込みデータの**型・必須項目・文字数のみ検証**する
   （**削除操作にはバリデーションが適用されないため「誰でも削除可」の仕様には影響しない**）。

```json
{
  "rules": {
    "members": {
      ".read": true,
      ".write": true,
      "$memberId": {
        ".validate": "newData.hasChildren(['name','target','updatedAt'])",
        "name": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 40" },
        "target": { ".validate": "newData.isString() && newData.val().matches(/^[0-9]{1,3}\\.[0-9]{1,2}$/)" },
        "result": { ".validate": "newData.val() == null || (newData.isString() && newData.val().matches(/^[0-9]{1,3}\\.[0-9]{1,2}$/))" },
        "updatedAt": { ".validate": "newData.isNumber()" },
        "records": {
          "$recordId": {
            ".validate": "newData.hasChildren(['date','time','at'])",
            "date": { ".validate": "newData.isString() && newData.val().matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)" },
            "time": { ".validate": "newData.isString() && newData.val().matches(/^[0-9]{1,3}\\.[0-9]{1,2}$/)" },
            "note": { ".validate": "newData.val() == null || (newData.isString() && newData.val().length <= 80)" },
            "at": { ".validate": "newData.isNumber()" },
            "$other": { ".validate": false }
          }
        },
        "$other": { ".validate": false }
      }
    },
    "events": {
      ".read": true,
      ".write": true,
      "$eventId": {
        ".validate": "newData.hasChildren(['date','title','updatedAt'])",
        "date": { ".validate": "newData.isString() && newData.val().matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)" },
        "title": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 60" },
        "note": { ".validate": "newData.val() == null || (newData.isString() && newData.val().length <= 200)" },
        "updatedAt": { ".validate": "newData.isNumber()" },
        "attendees": {
          "$attendeeId": {
            ".validate": "newData.hasChildren(['name','at'])",
            "name": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 24" },
            "at": { ".validate": "newData.isNumber()" },
            "$other": { ".validate": false }
          }
        },
        "$other": { ".validate": false }
      }
    }
  }
}
```

有効化後の確認: `curl -s "$BASE/events.json" -X POST -d '{"title":"x"}'`（`date`/`updatedAt`欠落）が
拒否されること、App Checkトークンなしのリクエスト（＝`curl`全般）が拒否されることを確認する。

### REST で直接DBを見る/掃除する
```bash
BASE="https://climb-sefuri-default-rtdb.asia-southeast1.firebasedatabase.app"
curl -s "$BASE/members.json"          # 全メンバー
curl -s "$BASE/events.json"           # 全予定
curl -s -X DELETE "$BASE/members/<id>.json"   # 削除
```

---

## 5. ディレクトリ / 主要ファイル

```
src/
├── main.ts                 # シェル描画・各ビューの mount・ルーター初期化
├── router.ts               # ハッシュルーティング。開いたら常にホーム。data-goto はイベント委譲
├── types.ts                # Member / RecordItem / MemberRecord / CalEvent / Attendee / Tier など
├── views/
│   ├── home.ts             # ヒーロー＋「近い予定」(mountHomeUpcoming)
│   ├── ranks.ts            # 称号カード＋達成ステッカー(表示のみ)
│   ├── members.ts          # ★リーダーボード＋記録登録＋履歴（mountMembersView）
│   ├── calendar.ts         # 月カレンダー＋近日リスト＋予定CRUD＋参加表明(RSVP)
│   └── join.ts             # 参加登録フォーム（名前＋目標タイム、リザルト欄なし）
├── components/
│   ├── defs.ts             # 称号エンブレムSVG定義(SVG_DEFS_INNER, injectSvgDefs, emblemMarkup)
│   ├── sticker.ts          # ステッカー画像ギャラリー＋DLヘルパー(stickerDownload, DOWNLOAD_ICON)
│   ├── meter.ts            # 進捗メーター
│   └── memberForm.ts       # 共有フォーム(参加ページ用)＋TIME_PATTERN
├── firebase/
│   ├── config.ts           # Firebase設定＋isFirebaseConfigured
│   ├── db.ts               # getRtdb() 共通初期化（App二重初期化を getApps() で防止）
│   ├── membersStore.ts     # メンバー＋記録ストア。memberBestSeconds / sortMembers / addRecord / removeRecord
│   ├── eventsStore.ts      # 予定＋参加表明ストア。join / leave
│   └── time.ts             # mmssToSeconds / secondsToClock（mm.ss ⇔ 秒 ⇔ mm:ss）
├── data/
│   ├── tiers.json / tiers.ts   # 6ティア定義＋judgeTier / tierLabel
│   ├── members.json        # モック/初期シード（Firオフ時のみ使用）
│   └── stickerImages.ts    # 実ステッカー画像のimportマップ(iron..titan, finisher)
├── lib/
│   └── format.ts           # todayISO / formatEventDate / escapeHtml / WEEKDAYS / isoOf / pad
├── assets/stickers/        # iron/bronze/silver/gold/platinum/titan/finisher .jpg（実物）
└── styles/                 # tokens.css（変数）/ base.css / components.css
```

---

## 6. 画面と機能（現状）

タブ（ナビ）: **ホーム / 称号 / メンバー / カレンダー / 参加する**
- ルーターは **URLを開くと常にホーム始まり**（`#ranks` 等が付いていても無視）。
- タブ遷移・`data-goto` 遷移はイベント委譲で処理（動的追加要素も遷移可）。

| 画面 | 内容 |
|---|---|
| ホーム | ヒーロー、統計、標高プロファイル。リード文の下に**「近い予定」**（今日以降3件、Firebase連動、クリックでカレンダーへ）。CTAは「参加する」「称号システムを見る」 |
| 称号 | 6ティアのランクカード（エンブレムに微光アニメ）＋**達成ステッカー実画像7枚（Finisher含む）を表示のみ**（DLボタンは無し） |
| メンバー | **ベストタイム順リーダーボード**。記録登録フォーム（メンバー選択・走った日・タイム・メモ）、各カードにベスト/回数/**履歴（折りたたみ・最速にBESTバッジ）**、称号・メーター・**ステッカーDL**（完走者はFinisher） |
| カレンダー | 月グリッド（予定ドット・日曜赤/土曜青・今日枠）＋近日リスト。予定の追加/編集/削除。各予定に**参加表明(RSVP)**（名前チップ＋×取消）＋**「LINEで告知」ボタン**（後述） |
| 参加する | STEPカード＋参加登録フォーム（名前＋目標タイム）→ メンバーに追加 |

---

## 7. データモデル

タイムは全て **`mm.ss` 文字列**（例: 52分30秒 → `"52.30"`）。内部比較は `mmssToSeconds` で総秒数化。表示は `secondsToClock`（`mm:ss`）。

```
members/{id}: {
  name: string,
  target: "mm.ss",
  result: "mm.ss" | (省略/null),   # 旧システムの単一ベスト。記録が無い間のベストとして使う
  updatedAt: number,
  records?: {                       # ★記録履歴
    {recordId}: { date: "YYYY-MM-DD", time: "mm.ss", note?: string, at: number }
  }
}

events/{id}: {
  date: "YYYY-MM-DD",
  title: string,
  note?: string,
  updatedAt: number,
  attendees?: {                     # 参加表明
    {attendeeId}: { name: string, at: number }
  }
}
```

- **ベストタイム** = `memberBestSeconds()`：記録があれば記録内の最速、無ければ `result`（レガシー）。
- **リーダーボード順** = ベストの昇順、ベスト無しは下。`sortMembers()`。
- **称号判定** = `judgeTier(bestSeconds)`：<40→titan / <45→platinum / <50→gold / <55→silver / <60→bronze / <65→iron / ≥65→finisher(完走) / null→none(未達成)。

---

## 8. 実装済みの流れ・主要な意思決定

実装順（要点）:
1. 単一HTMLプロトタイプ → Vite+TS へ分割（仕様書 `climb-sefuri-spec.md` の構成に準拠）
2. ホームのLINEボタン削除→「参加する」。参加ページはリザルト欄なし（名前＋目標のみ）
3. モダンデザイン強化（グレイン/ヴィネット、ガラス縁ヘアライン、見出しシマー、ボタン光沢、カード浮遊、スタッガー登場）
4. 称号エンブレムの微光アニメ＋メンバーカードの華やかさ（順位バッジ、ティア色グロー、メーターのシマー）
5. 称号ステッカーを**実画像7枚**へ差し替え（+Finisher）。**称号ページは表示のみ**、DLはメンバーカード
6. Vercel + GitHub 自動デプロイ構築 → Firebase 本設定でリアルタイム化
7. カレンダー機能（月表示＋近日リスト＋CRUD）→ 各予定に**参加表明(RSVP)**
8. ホームに「近い予定」表示
9. メンバーを**記録・履歴・ベストタイム リーダーボード**に拡張（最新）

**重要な前提・決定**:
- 元仕様書 §1「申込フォーム設置しない・LINEのみ」は**ユーザーが明示的に上書き**（登録/記録/カレンダーを実装）。**仕様書 `.md` 本体は未更新**。
- **認証なしは意図的**（誰でも読み書き削除可）。荒らしリスクは許容済み。App Check + ルールバリデーションで軽減中（§4-1）。
- 記録は**自己申告のみ、Strava連携なし**。
- localStorage/sessionStorage 不使用。
- **カレンダーの「LINEで告知」ボタン**（`src/lib/format.ts` の `lineShareUrl`）は、LINEの汎用共有インテント
  （`https://line.me/R/msg/text/?text=...`）を開くだけで、**送信先のトークルームの招待リンクはコードに一切含めない**設計。
  理由: このサイト／リポジトリは公開されているため、招待リンクをJSに埋め込むと不特定多数が非公開グループへ
  参加できてしまう。送信先はボタンを押した本人（＝既存メンバー）がLINEの共有シートから選ぶ。
  自動投稿Bot（LINE Messaging API + Cloud Functions）は未実装・提案のみ（ユーザーが今回は見送りと判断）。

---

## 9. 開発環境の注意点（ハマりどころ）

- **OS**: Windows。PowerShell と Git Bash（Bashツール）併用。**bash では Node に PATH を通す**：`export PATH="$PATH:/c/Program Files/nodejs"`。
- **プレビュー系ツールは `mcp__Claude_Browser__*`**（旧 `mcp__Claude_Preview__*` は廃止）。dev サーバー名は **`climb-sefuri-dev`**（`.claude/launch.json`、gitignore対象）。
- **HMRが不安定**：プロジェクトが OneDrive 配下のため、ファイル同期イベントで Vite が頻繁にリロードし、**SPAがホームに戻る**ことがある。ブラウザ検証では
  - JS実行(`javascript_tool`)よりも **`computer` の実クリックの方がリロードに強い**。
  - スクショがホームに戻った状態を写すことがある → 直前に明示ナビゲート＆再確認。
- **CRLF警告**（`LF will be replaced by CRLF`）はコミット時に出るが**無害**。
- `.gitignore`: `node_modules` / `dist` / `.claude` / `.vscode` / `*.local`。**`dist` はコミットしない**（Vercelがビルド）。
- たまに `particles.ts` 等に未コミットの差分が現れることがある → 見に覚えのない変更は勝手にコミット/破棄せずユーザーに確認。

---

## 10. 検証のやり方（データ安全）

- **dev サーバーも本番 Firebase に接続する**ため、実メンバー・実予定を壊さないこと。
- 検証は**専用のテストデータ**を使い、**必ず後始末**する：
  - テストメンバー作成: `curl -X POST -d '{"name":"__test__","target":"50.00","updatedAt":1}' "$BASE/members.json"` → 返る id を使う → 検証後 `DELETE`。
  - テスト予定も同様に `events` へ。
- 実メンバーに記録を足して消す場合も、`records` サブツリーを元(空)に戻せば復元可。

---

## 11. 今後の候補（ユーザーに提案済み・未実装）

- 記録に**コース選択**（複数コース対応）
- 月別ベスト／自己ベスト更新（PB）の演出
- RSVP を「参加/不参加/未定」の3択に、参加者名をメンバー表と連動
- 記録の CSV 書き出し
- **スマホのナビ**：タブが2段に折り返す → 横スクロール1行化（要望済み・未対応）
- OGP / favicon（ゴールドエンブレム流用）、独自ドメイン
- Firebase ルールの厳格化: **バリデーション強化のJSON・クライアント側コードは実装済み（§4-1）。
  App Check登録／Enforce有効化／ルール貼り付けのコンソール操作が未完了**。削除制限などのさらなる絞り込みは別途未着手。
- LINE自動投稿Bot（Messaging API + Cloud Functions、要Blazeプラン）— 提案のみ、未実装

---

## 12. 参照ファイル（デスクトップ、リポジトリ外）

- `climb-sefuri-spec.md` — 元の仕様書（v1.0）。ただし現状はこの引き継ぎ書が実態に近い。
- `gemini-code-1783220486502.md` — Firebase/認証なし/称号自動判定の要件メモ。
- `climb-sefuri-app-v2.html` — 最初の単一HTMLプロトタイプ（参照実装）。
