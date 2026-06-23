# Stripe課金設定

Postfolioの課金機能をStripeのテスト環境で確認するための手順です。

## 1. 商品と月額料金を作成

Stripe Dashboardのテストモードで、次の2商品と月額Priceを作成します。

| 商品 | 金額 | 課金間隔 |
| --- | ---: | --- |
| Postfolio Pro | 500円 | 毎月 |
| Postfolio Creator | 980円 | 毎月 |

作成したそれぞれの `price_...` を控えます。

## 2. 環境変数を設定

`.env` に以下を設定します。

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_CREATOR_PRICE_ID="price_..."
```

## 3. Customer Portalを有効化

Stripe DashboardのCustomer Portal設定で、次の機能を有効にします。

- 支払い方法の更新
- 請求書履歴の表示とダウンロード
- 顧客情報の更新

プラン変更と解約予約はPostfolio内で行います。

## 4. ローカルWebhookを起動

Stripe CLIをインストールしてログイン後、別のターミナルで実行します。

```powershell
stripe listen --forward-to localhost:3000/api/billing/webhook
```

表示された `whsec_...` を `.env` の `STRIPE_WEBHOOK_SECRET` に設定し、
開発サーバーを再起動します。

## 5. 動作確認

Stripeのテストカードを使用します。

```text
カード番号: 4242 4242 4242 4242
有効期限: 任意の未来の日付
CVC: 任意の3桁
```

以下を順番に確認します。

1. FreeからProまたはCreatorを契約
2. Checkoutから戻った後に設定画面へプランが反映される
3. ProとCreatorを相互に変更できる
4. Freeへの変更で期間末解約が予約される
5. 解約予約を取り消せる
6. 支払い管理画面を開ける

## Webhookイベント

本番環境では次のイベントを `/api/billing/webhook` に送信します。

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`
