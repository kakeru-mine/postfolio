# SNSリサーチボックス MVP 設計

## 1. プロジェクト構成

```text
.
├─ prisma/
│  ├─ schema.prisma        # PostgreSQLデータモデル
│  └─ seed.ts              # デモユーザーと初期コレクション
├─ src/
│  ├─ app/
│  │  ├─ api/              # Route Handlers
│  │  ├─ collections/      # コレクション管理
│  │  ├─ items/[id]/       # 保存アイテム詳細
│  │  ├─ layout.tsx
│  │  └─ page.tsx          # 保存一覧
│  ├─ components/          # フォーム・カード・編集UI
│  └─ lib/
│     ├─ metadata.ts       # URLメタデータ取得
│     ├─ prisma.ts
│     ├─ validation.ts
│     └─ user.ts           # Phase 1のデモユーザー解決
└─ package.json
```

App RouterとRoute Handlersを採用し、画面・API・DBを単一のNext.jsプロジェクトにまとめる。Phase 1では認証画面を実装せず、`DEMO_USER_EMAIL`の単一ユーザーとして動作させる。`User`との関連は最初から持たせているため、Phase 2以降でAuth.jsのセッション解決へ置き換えられる。

## 2. Prisma schema

実体は `prisma/schema.prisma` を参照。

- `User`: 所有者。将来のAuth.js連携単位
- `SavedItem`: URL、メタデータ、用途、メモ、タグ、AI分析欄
- `Collection`: 保存アイテムを目的別に分類
- `SourcePlatform`: 対応SNSを列挙し、表記ゆれを防止
- `(userId, normalizedUrl)` を一意制約にし、同一URLの重複保存を防止
- コレクション削除時、アイテムは削除せず未分類へ移動

## 3. 主要画面一覧

| 画面 | URL | Phase 1の役割 |
| --- | --- | --- |
| 保存一覧 | `/` | カード一覧、検索、SNS・コレクション絞り込み、URL保存 |
| 保存詳細 | `/items/[id]` | メタデータ確認、タイトル・用途・メモ・タグ・分類の編集、削除 |
| コレクション管理 | `/collections` | 作成、編集、削除、件数表示 |
| 404 | 任意 | 存在しないアイテムへの案内 |

ログインとエクスポートは今後の検討対象。

## 4. API設計

### 保存アイテム

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/saved-items` | 一覧。`q`, `platform`, `collectionId`に対応 |
| `POST` | `/api/saved-items` | URL保存。メタデータをベストエフォートで取得 |
| `GET` | `/api/saved-items/:id` | 詳細取得 |
| `PATCH` | `/api/saved-items/:id` | タイトル、メモ、用途、タグ、分類を更新 |
| `DELETE` | `/api/saved-items/:id` | 削除 |

`POST` request:

```json
{
  "url": "https://example.com/post",
  "memo": "導入の見せ方が参考になる",
  "purpose": "note記事の構成参考",
  "collectionId": "clxxx",
  "tags": ["導入文", "企画"]
}
```

### コレクション

| Method | Path | 用途 |
| --- | --- | --- |
| `GET` | `/api/collections` | 件数付き一覧 |
| `POST` | `/api/collections` | 作成 |
| `PATCH` | `/api/collections/:id` | 名前、説明、色を更新 |
| `DELETE` | `/api/collections/:id` | 削除。所属アイテムは未分類へ |

## 5. Phase 1 実装範囲

- PostgreSQL + Prismaモデル
- デモユーザーの自動作成
- URL正規化と重複防止
- SNSプラットフォーム判定
- OGP / title / description / thumbnail / authorの取得
- URL保存フォーム
- 保存一覧と検索・絞り込み
- 保存詳細と編集・削除
- コレクション作成・編集・削除
- Zodバリデーション

URL取得は5秒で打ち切り、失敗しても保存を継続する。localhostと代表的なプライベートIPは拒否し、サーバー側リクエストの悪用を抑制する。

## 6. Phase 2 実装範囲

- 詳細画面からURLメタデータを再取得
- OpenAI Responses APIによる保存アイテム分析
- Structured OutputsとZodによる結果検証
- 要約、AIタグ、活用方法、注目される理由、コンテンツの切り口を保存
- 既存結果の表示と再分析
- X投稿本文・添付画像・引用投稿・スレッド情報の取得
- 画像入力を含むマルチモーダル分析

AI分析APIは `POST /api/ai/analyze-url` を使用する。APIキーは `OPENAI_API_KEY`、モデルは `OPENAI_MODEL` で設定し、未指定時は `gpt-5.5` を利用する。

X投稿は `X_BEARER_TOKEN` が設定されていればX API v2を使用し、未設定または取得失敗時は公開oEmbedへフォールバックする。スレッドは `conversation_id` と投稿者によるRecent Searchから最大20件を保存する。

## 7. Phase 4 実装範囲

- Free / Pro / Creatorのプラン管理
- 現在の保存件数による保存枠制限
- 日本時間の月単位によるAI分析回数制限
- Stripe Checkoutによる新規契約
- Stripe Customer Portalによるプラン変更・解約・支払い管理
- 署名検証済みWebhookによる契約状態同期
- 料金ページ、設定・利用状況ページ
- 利用規約、プライバシーポリシー

プラン上限はアプリDBで判定する。AI分析は実行前に `AiUsageMonth` の枠を原子的に確保し、OpenAI API呼び出し失敗時は回数を戻す。コンテンツ生成機能および生成回数枠は実装しない。
