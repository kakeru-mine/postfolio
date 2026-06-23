# Postfolio - SNS Research Box

SNSで見つけた投稿URLを保存し、メモ・タグ・コレクションとAI分析で整理するMVPです。

## セットアップ

1. PostgreSQLを用意する（Dockerを使う場合は `docker compose up -d`）
2. `.env.example` を `.env` に複製し、`DATABASE_URL` を設定
3. 依存関係とDBを準備

```bash
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

`http://localhost:3000` を開きます。Phase 1は `DEMO_USER_EMAIL` の単一デモユーザーで動作します。

## Phase 2: AI分析

`.env` にOpenAI APIキーを設定します。

```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5.5"
```

設定後に開発サーバーを再起動します。保存アイテムの詳細画面から以下を実行できます。

- ページタイトル・説明・サムネイルの再取得
- AI要約
- AIタグ
- 活用方法
- 注目される理由
- コンテンツの切り口

APIキーはブラウザへ送信せず、Next.jsのサーバー側だけで使用します。AI分析にはOpenAI APIの利用料金が発生します。

## X投稿の詳細取得

X投稿は公開oEmbed情報を自動取得します。本文、添付画像、引用投稿、同一投稿者のスレッドをより確実に取得する場合は、X Developer ConsoleでBearer Tokenを作成し、`.env`へ設定します。

```env
X_BEARER_TOKEN="作成したBearer Token"
```

設定すると、X APIの投稿取得・メディア展開・引用投稿展開を使用します。スレッド取得はXのRecent Search対象期間内に限られ、X APIの利用料金が別途発生する場合があります。

## Phase 4: プランとStripe課金

| プラン | 月額 | 保存枠 | AI分析 |
| --- | ---: | ---: | ---: |
| Free | 0円 | 30件 | 無制限（機能確認中） |
| Pro | 500円 | 200件 | 月100件 |
| Creator | 980円 | 500件 | 月200件 |

保存操作の累計回数には制限を設けず、現在保存している件数で上限を判定します。AI分析回数は日本時間の毎月1日にリセットされます。

Stripe DashboardでProとCreatorの月額Priceを作成し、`.env`へ設定します。

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_CREATOR_PRICE_ID="price_..."
```

Webhook URLは `/api/billing/webhook` です。以下のイベントを登録します。

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Stripe Customer Portalでは、支払い方法更新と請求履歴を利用します。プラン変更と解約予約はPostfolio内で行います。

Stripeの接続手順とテスト方法は [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) を参照してください。

利用規約とプライバシーポリシーの運営者情報は次で設定します。

```env
LEGAL_OPERATOR_NAME="運営者名"
LEGAL_CONTACT_EMAIL="contact@example.com"
```

設計詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。
