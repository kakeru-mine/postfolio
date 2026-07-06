# Postfolio 仕様書（v1.0.0）

SNSで見つけた良い投稿を保存・整理し、AI分析で「次の企画に使えるリサーチ資産」に変えるWeb SaaS。
本書は引き継ぎ・共有用の全体仕様まとめ。**特に「外部接続・APIとコスト」は §5 に集約**。

---

## 1. 概要

- **プロダクト名**：Postfolio（ポストフォリオ）
- **本番URL**：https://postfolioapp.com
- **公式X**：[@postfolio_app](https://x.com/postfolio_app)（広報用。**LPフッターの「Postfolio」タイトル右のXアイコン**からリンク）。開発者は屋号「峰芝駆」名義のアカウントでも運用予定（2アカウント体制）。
- **サービス開始日**：2026年7月7日（初版 v1.0.0）
- **一言で**：SNS投稿URLを保存 → メモ/タグ/コレクションで整理 → AIが要約・評価・再利用案を提示。
- **対象ユーザー**：日本のクリエイター／発信者（企画・投稿のネタ管理）。**UIは日本語主体**、公開ページ（LP・規約・お知らせ・お問い合わせ）のみ英語切替対応。
- **対応SNS（メタ取得）**：X / Instagram / Threads / YouTube / note / Substack / TikTok（今後追加予定）。
  - ※YouTubeは**動画のみ専用対応**。コミュニティ（テキスト）投稿は未対応（保留）。

## 2. 技術スタック

| 分類 | 採用 |
|---|---|
| フレームワーク | Next.js 15（App Router）/ React 19 / TypeScript |
| スタイル | Tailwind CSS |
| DB / ORM | PostgreSQL（Supabase）/ Prisma |
| 認証 | 独自実装（scryptハッシュ＋セッションCookie。メール確認・パスワード再設定・ログインロック付き） |
| 決済 | Stripe（サブスク・Customer Portal・Webhook） |
| メール | Resend（トランザクションメール） |
| AI | OpenAI API（`/v1/responses`、既定モデル `gpt-5.5`／`OPENAI_MODEL`で変更可） |
| 画像永続化 | Supabase Storage（公開バケット） |
| メタ取得 | HTMLスクレイピング（cheerio）＋各SNSのOGP/oEmbed |
| エラー監視 | Sentry（`@sentry/nextjs`、ソースマップ＋GitHub連携） |
| ホスティング | Vercel（Hobbyプラン）。GitHub push で自動デプロイ |
| OG画像生成 | sharp（`scripts/generate-og-image.mjs` で `public/og-*.png` を生成） |
| 主要ライブラリ | zod（バリデーション）/ date-fns / lucide-react / stripe / cheerio |

## 3. 主要機能

- **保存アイテム**：SNS投稿URLを保存。メタ（タイトル・本文・投稿者・サムネ・公開日）を自動取得。メモ・タグ付け。
- **コレクション**：保存投稿を分類ごとに整理。
- **AI分析**：投稿の要約・S〜E評価・伸びた/伸びない理由・再利用アイデア（3〜5個）を生成。プランごとに回数制限。
- **プラン/課金**：Free / Pro / Creator（§7）。アップグレード即時課金、ダウングレードは期間終了時に切替。
- **お知らせ**：管理者が投稿（下書き/公開・再通知）、ユーザーは未読バッジ＋既読管理。本文はOpenAIで英訳自動生成。
- **配信中ブロック**：ライブ/プレミア配信中・配信予定は保存拒否（終了アーカイブは可）。YouTube・Instagram Live・X Spaces・TikTok LIVE等。
- **画像永続化**：Threads/Instagram等の署名付きCDN画像（数日で失効）を保存時にSupabase Storageへ再ホスト。
- **セキュリティ**：メール確認必須、ログイン5回失敗で15分ロック、メール送信レート制限。
- **公開ページ**：LP（`/`＝未ログイン時、`/welcome`）・利用規約・プライバシー・特商法・お知らせ・お問い合わせ。SEO（robots/sitemap）・OGP/Xカード対応。

## 4. データモデル（Prisma）

| モデル | 役割 |
|---|---|
| `User` | ユーザー。プラン/Stripe情報/テーマ色/メール確認/ロック状態/`scheduledPlan`（予約プラン）等 |
| `Session` | ログインセッション（トークンハッシュ） |
| `UserToken` | メール確認・パスワード再設定トークン（`UserTokenType`） |
| `SavedItem` | 保存投稿（URL・メタ・メモ・タグ・AI分析結果・並び順・コレクション参照） |
| `Collection` | コレクション（分類） |
| `AiUsageMonth` | AI分析の期間別利用回数（プラン制限の集計） |
| `Announcement` | お知らせ（本文＋英訳 `titleEn`/`bodyEn`・公開フラグ・公開日） |
| `AnnouncementRead` | ユーザー別の既読記録 |
| enum | `SourcePlatform`（X/YOUTUBE/…）, `SubscriptionPlan`（FREE/PRO/CREATOR）, `UserTokenType` |

> マイグレーション：ローカル `npx prisma migrate dev`。**本番はVercelビルドで自動実行されないため、手動で** `DATABASE_URL`（ポート5432のDirect/Session接続）を指定して `npx prisma migrate deploy` を実行する運用。

---

## 5. 外部接続・API と コスト ★

### 5-1. コスト早見表

| サービス | 用途 | 現在のプラン | 月額コスト | 種別 | 備考 |
|---|---|---|---|---|---|
| **Vercel** | ホスティング/デプロイ/関数 | Hobby（無料） | **¥0** | 固定 | 個人利用の無料枠内。超過や商用制限時は Pro $20/月 |
| **ドメイン**（postfolioapp.com） | 独自ドメイン | Vercel Domains | **約$11.25/年**（≒¥1,700/年） | 固定 | 更新も同額。**請求先住所の登録必須**（未登録だと更新失敗の恐れ） |
| **Supabase** | PostgreSQL＋Storage | Free | **¥0** | 固定 | DB 0.5GB / Storage 1GB 等の無料枠。超過時 Pro $25/月 |
| **OpenAI API** | AI分析・お知らせ英訳 | 従量課金 | **変動**（利用量次第） | **変動費** | §5-2。実質の主要変動費 |
| **Stripe** | 決済/サブスク | 標準 | 月額固定なし | **変動費（手数料）** | 決済ごとに手数料（日本のカード 約3.6%）。§7 |
| **Resend** | メール送信 | Free | **¥0** | 固定 | 3,000通/月・100通/日の無料枠。超過時 Pro $20/月 |
| **Sentry** | エラー監視 | Developer（無料） | **¥0** | 固定 | 5,000エラー/月・1ユーザー。超過時 Team $26/月 |
| **X (Twitter) API** | X Spaces配信判定・X投稿メタ補強 | 未使用/任意 | **¥0（未設定）** | 条件付き | §5-3。**無くても動作**。使う場合、読み取りは有料枠（Basic $100/月〜）が必要になり得る |
| **Instagram oEmbed** | Instagram投稿の情報補強 | 未使用/任意 | **¥0** | 条件付き | §5-3。Meta無料API（要アプリ設定）。**無くても動作** |
| **Google Search Console** | SEO/サイトマップ | 無料 | **¥0** | 固定 | サイトマップ送信済み |
| **GitHub** | ソース管理・Sentry連携 | 無料 | **¥0** | 固定 | リポジトリ `kakeru-mine/postfolio` |

**要点**
- **現状はほぼ全て無料枠で運用**。固定費は実質「ドメイン約¥1,700/年」のみ。
- **変動費の中心は ①OpenAI（AI分析）と ②Stripe手数料（売上連動）**。
- ユーザー/データ/エラーが増えると、Supabase・Resend・Sentry・Vercel が順に有料枠へ移行する可能性（各サービスの無料枠上限に注意）。

### 5-2. OpenAI（変動費の主役）

- **用途**：(a) 保存投稿のAI分析（画像も入力＝入力コスト増）、(b) お知らせ投稿/編集時の英訳生成。
- **課金**：トークン従量。**モデル（`OPENAI_MODEL`、既定 `gpt-5.5`）と入出力トークン量・画像枚数で変動**。正確な単価は利用モデルのOpenAI公式価格を要確認。
- **コストの上限が効く設計**：
  - AI分析は**プランで回数制限**（Free 1回/日、Pro 100回/月、Creator 200回/月）。→ 1ユーザーあたりの最大AIコストは頭打ち。
  - お知らせ英訳は**管理者投稿時のみ**（低頻度）。
- **概算の考え方**：`月間AIコスト ≒ 有料ユーザー数 × 各人のAI分析回数 × 1回あたり単価`。1回あたりは数円〜十数円規模を目安に、実測して単価を確定するのが安全。
- **タイムアウト対策**：AI呼び出しルートは `maxDuration=60` を設定済み（`/api/ai/analyze-url`、お知らせ管理API）。

### 5-3. SNSメタ取得の方針（コスト最適化）

- **原則スクレイピング（cheerio）＋各SNSのOGP/oEmbedで無料取得**。X/note/Substack/Threads/Instagram/TikTok/YouTubeの大半はAPIキー不要。
- **X API（`X_BEARER_TOKEN`）＝任意**：
  - `live-broadcast.ts`：X Spacesの「配信中」判定に使用（未設定なら判定スキップ＝ブロックしない）。
  - `x-content.ts`：X投稿メタの補強（未設定ならスクレイピングにフォールバック）。
  - **コスト注意**：X APIの読み取りは無料枠が非常に限定的で、実用にはBasic（$100/月〜）が必要になる場合あり。**現状は未設定＝¥0**。
- **Instagram oEmbed（`INSTAGRAM_OEMBED_ACCESS_TOKEN`）＝任意**：未設定ならOGスクレイピングにフォールバック。Meta無料APIだがアプリ設定・審査が必要。
- **YouTube**：oEmbed（無料）＋ページ内JSONで動画メタ取得。APIキー不要。

---

## 6. 環境変数一覧

| 変数 | 用途 | 必須 |
|---|---|---|
| `DATABASE_URL` | Prisma（Supabase Postgres接続。ランタイムは6543 pooler、マイグレーションは5432） | ✅ |
| `NEXT_PUBLIC_APP_URL` | 正規URL（`https://postfolioapp.com`）。OG・メールリンク・共有に使用 | ✅ |
| `OPENAI_API_KEY` | OpenAI APIキー | ✅（AI機能に必須） |
| `OPENAI_MODEL` | 使用モデル（既定 `gpt-5.5`） | 任意 |
| `STRIPE_SECRET_KEY` | Stripe秘密鍵（本番 `sk_live_…`） | ✅（課金に必須） |
| `STRIPE_WEBHOOK_SECRET` | Webhook署名シークレット（`whsec_…`） | ✅ |
| `STRIPE_PRO_PRICE_ID` / `STRIPE_CREATOR_PRICE_ID` | 各プランのStripe Price ID | ✅ |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_MEDIA_BUCKET` | 画像永続化（Storage REST） | ✅（画像保存に必須） |
| `RESEND_API_KEY` | メール送信 | ✅（メールに必須） |
| `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL` | 送信元/問い合わせ受信先 | ✅ |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | エラー監視（サーバー/クライアント） | 任意（未設定で無効） |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | ソースマップアップロード（org/project＝`postfolio`） | 任意 |
| `ADMIN_EMAILS` | 管理者メール（カンマ区切り）。お知らせ管理の権限判定 | ✅（管理機能に必要） |
| `X_BEARER_TOKEN` | X API（Spaces判定・X投稿補強） | 任意 |
| `INSTAGRAM_OEMBED_ACCESS_TOKEN` | Instagram oEmbed補強 | 任意 |
| `LEGAL_OPERATOR_NAME` / `LEGAL_SELLER_NAME` / `LEGAL_RESPONSIBLE_PERSON` / `LEGAL_SELLER_ADDRESS` / `LEGAL_SELLER_PHONE` / `LEGAL_CONTACT_EMAIL` | 特商法ページ表記（屋号「峰芝駆」/戸籍名「井上 隼人」等） | ✅（特商法表記に必要） |
| `DEMO_USER_EMAIL` | デモ用途 | 任意 |

> **秘密情報（`.env`・各種キー）は絶対にコミットしない**。本番はVercelの環境変数で管理。

## 7. プラン / 課金

| プラン | 月額（税込） | 保存枠 | AI分析 |
|---|---|---|---|
| Free | ¥0 | 30件 | 1回/日 |
| Pro | ¥500 | 200件 | 100回/月 |
| Creator | ¥980 | 500件 | 200回/月 |

- **アップグレード**（Pro→Creator）：アプリ内で差額を確認→**即時課金**（proration）。
- **ダウングレード**（Creator→Pro/Free）：**期間終了時に切替**（Stripe subscription schedule、`scheduledPlan`で管理、予約バナー表示・取消可）。
- **決済フロー**：Stripe Checkout（サブスク）＋Customer Portal。Webhook（`/api/billing/webhook`）でプラン状態を同期。
- **手取り**：売上からStripe手数料（日本のカード 約3.6%）を差し引いた額。例）Pro ¥500→約¥482、Creator ¥980→約¥945。
- **決済失敗時（更新引き落とし失敗 / dunning）の挙動**：
  - サブスクが `past_due` になり、**猶予中はプランを維持**（`billing.ts` の `PAID_ACCESS_STATUSES = {active, trialing, past_due}`）。ホーム画面の「お支払い状況」に「支払い遅延」と表示。
  - Stripeが自動リトライ（Smart Retries）。**失敗時は顧客へ自動メール送信**（Stripeダッシュボードで「カード決済失敗時のメール」をON済み）、カード更新は**Stripeホストのページ**へ誘導（Customer Portal相当）。
  - リトライが全失敗すると**サブスクを自動キャンセル**（Stripe設定）→ `customer.subscription.deleted` Webhook → **アプリが自動でFreeへ降格**。
  - ※**アプリ独自の失敗通知メール/アプリ内バナーは未実装**（Stripeの顧客メールで代替）。必要なら `invoice.payment_failed` のWebhook処理追加で対応可能。

## 8. デプロイ・運用

- **本番反映**：GitHub（`main`）へpush → Vercelが自動デプロイ。
- **DBマイグレーション**：本番は手動 `prisma migrate deploy`（5432接続）。
- **必須チェック（変更時）**：`npm run lint` / `npm run typecheck` / `npm run build`。
- **ドメイン**：`postfolioapp.com`（Vercel Domains）。旧 `postfolio-sigma.vercel.app` は 308 で新ドメインへリダイレクト。
- **OGカード更新時**：`scripts/generate-og-image.mjs` で `og-*.png` 再生成 → `welcome/page.tsx` の `OG_VERSION` / `layout.tsx` の `?v=` / `share-buttons.tsx` の `OG_SHARE_VERSION` を揃えてバージョン番号を上げる（Xキャッシュ破棄）。
- **監視**：Sentryでサーバー/クライアントのエラーを収集（ソースマップで元コード行表示、GitHubで原因コミット特定）。

## 9. 主要ディレクトリ / ファイル

- `src/app/` … ページ・APIルート（App Router）
  - `page.tsx`（`/`＝未ログインLP／ログイン時ダッシュボード）, `welcome/`（LP）, `items/`, `collections/`, `pricing/`, `settings/`, `announcements/`, `admin/announcements/`, 規約系, `api/*`
  - `icon.png` / `apple-icon.png`（favicon）, `robots.ts`, `sitemap.ts`
- `src/lib/` … `metadata.ts`（SNSメタ取得）, `openai.ts`, `announcement-translate.ts`, `image-storage.ts`, `live-broadcast.ts`, `auth.ts`, `auth-tokens.ts`, `email.ts`, `stripe.ts`, `billing.ts`, `plans.ts`, `usage.ts`, `admin.ts`, `announcements.ts`, `x-content.ts`, `version.ts`
- `src/components/` … `app-shell.tsx`（ヘッダー/ナビ）, `language-dom-translator.tsx`（英語化辞書）, `theme-settings.tsx`, `contact-form.tsx`, `landing-v0/*`（LP）, `announcement-*`（お知らせ）ほか
- `prisma/schema.prisma`, `prisma/migrations/`
- `scripts/generate-og-image.mjs`（OG画像生成）
- `docs/` … `SPEC.md`（本書）, `ARCHITECTURE.md`, `STRIPE_SETUP.md`, `I18N.md`, `privacy-incident-response.md`

## 10. 既知の制約・保留事項

- **英語対応**：公開ページのみ英語（DOM翻訳辞書方式）。認証後アプリは日本語固定。全面英語化するなら next-intl 移行が必要（`docs/I18N.md`）。文言追加時は辞書更新が必要（開発時に未翻訳検知あり）。
- **YouTubeコミュニティ（テキスト）投稿**：未対応（保留）。動画のみ専用対応。
- **SNSシェア**：X/Threads/LINEは共有intentあり。Instagram/TikTok/note等は共有用URLが無く自動共有不可（リンクコピーで代替）。
- **検索表示**：メタ説明・faviconはGoogleの反映に数日〜数週間かかる。メタ説明はGoogleが本文から自動生成する場合があり強制不可。
- **任意の残タスク**：X API/Instagram連携の有効化（コスト注意）、Sentry無料枠の監視、Supabase/Resend無料枠の監視。

## 11. 今後の拡張予定（ロードマップ）

当面は以下の2点。

### ① 対応SNSの追加（LINE / Facebook / LinkedIn / Reddit ほか）
- **実装ポイント**：`SourcePlatform`（enum）／`src/lib/platform.ts`（URL判定）／`src/lib/metadata.ts`（メタ抽出）／`src/lib/live-broadcast.ts`（該当あれば配信判定）／LP・保存画面のSNSフィルタチップ。
- **既存の下地**：`SourcePlatform` enum には **FACEBOOK / LINKEDIN / REDDIT の枠が既に存在**（LINEは未追加）。→ 追加作業はenum拡張＋各SNSの抽出ロジック実装が中心。
- **各SNSの難易度メモ**：
  - **Reddit**：投稿URL末尾に `.json` を付けると公開JSON APIが使え、比較的容易。
  - **Facebook / LinkedIn**：スクレイピング制限が強く、ログイン/公式APIが必要になりがち。メタ取得の可否・精度に注意。
  - **LINE**：一般的な「投稿URL」の概念が弱い（LINE VOOM等）。共有・メタ取得の可否を先に要検証。
- **コスト観点**：公式APIを使う場合は各社の料金・審査を確認。§5の方針（**可能な限りスクレイピングで無料取得**）を維持するのが望ましい。

### ② モバイルアプリ（iOS / Android）
- 現状はNext.jsのWebアプリ。モバイル化の選択肢：
  - **PWA / WebViewラッパー**：最短。既存Web資産を再利用。
  - **React Native / Expo**：ネイティブUX。一部ロジック再利用。
  - **フルネイティブ**：コスト最大。
- **前提作業（重要）**：現在の認証は**セッションCookie方式**。モバイルアプリは**トークン（Bearer）ベースのAPI認証**が必要になるため、**認証層の追加・API整理が先行タスク**になる。
- 既存のNext.js APIルートはモバイルのバックエンドとして流用可能（**認証方式の調整が鍵**）。

> 上記2点は着手時期未定。実装前に、対象SNSごとの取得可否検証（①）／認証方式の設計（②）から始めるのが安全。

---

_最終更新：v1.0.0 初版。数値（無料枠上限・各社料金・OpenAI単価）は各サービスの最新公式情報を随時確認のこと。今後の拡張予定は §11。_
