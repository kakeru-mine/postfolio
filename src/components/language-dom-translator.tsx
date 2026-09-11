"use client";

import { useEffect } from "react";
import type { AppLanguage } from "@/components/language-switcher";

// ⚠️ TRANSLATION RULE (read before adding/changing UI text)
// English mode is a DOM-translation layer: it walks the text nodes inside <main>
// and swaps any node whose *entire trimmed text* exactly matches a key below.
// Consequences any contributor must keep in mind:
//   1. New Japanese UI text in a page/component stays Japanese in English mode
//      until you add an exact-match entry here. ALWAYS update this dictionary in
//      the same change that introduces the text.
//   2. The key must match the rendered text character-for-character. A different
//      particle (に vs へ), trailing punctuation, or a reworded label silently
//      breaks the match. When you reword Japanese text, update the key too.
//   3. The matcher only sees text nodes inside <main>; header/footer chrome is
//      translated via the app-shell `labels` map instead.
//   4. Dynamic/user-generated text (DB content, dates) cannot be translated here.
//      Render it through a client component that takes ja/en props (see
//      announcement-translatable.tsx) and provide the English value at the source.
// See docs/I18N.md for the full policy and the planned next-intl migration.
const translations: Record<string, string> = {
  "ホーム": "Home",
  "保存アイテム": "Saved Items",
  "コレクション": "Collections",
  "プラン一覧": "Plans",
  "マニュアル": "Manual",
  "設定": "Settings",
  "利用規約": "Terms",
  "プライバシー": "Privacy",
  "特商法表記": "Legal Notice",
  "特定商取引法に基づく表記": "Legal Notice Based on the Specified Commercial Transactions Act",
  "プライバシーポリシー": "Privacy Policy",
  "お問い合わせ": "Contact",
  "Postfolioに戻る": "Back to Postfolio",
  "利用規約へ戻る": "Back to Terms",
  "最終更新日：2026年6月13日": "Last updated: June 13, 2026",
  "最終更新日：2026年6月20日": "Last updated: June 20, 2026",
  "販売事業者": "Seller",
  "運営責任者": "Responsible Party",
  "所在地": "Address",
  "電話番号": "Phone Number",
  "メールアドレス": "Email Address",
  "販売価格": "Sales Price",
  "商品代金以外の必要料金": "Additional Fees",
  "支払方法": "Payment Method",
  "支払時期": "Payment Timing",
  "サービス提供時期": "Service Availability",
  "解約について": "Cancellation",
  "返品・キャンセル・返金": "Returns, Cancellations, and Refunds",
  "動作環境": "System Requirements",
  "本規約は、": "These Terms set forth the conditions for use of the SNS research box \"Postfolio\" provided by ",
  "が提供するSNSリサーチボックス「Postfolio」の利用条件を定めるものです。":
    ".",
  "1. 適用": "1. Scope",
  "2. アカウント": "2. Account",
  "3. 未成年の利用": "3. Use by Minors",
  "4. プランと利用上限": "4. Plans and Usage Limits",
  "5. 有料プラン": "5. Paid Plans",
  "6. 返金": "6. Refunds",
  "7. 退会・アカウント削除": "7. Withdrawal and Account Deletion",
  "8. 禁止事項": "8. Prohibited Acts",
  "9. 外部サービスとAI": "9. External Services and AI",
  "10. 保存コンテンツと権利": "10. Saved Content and Rights",
  "11. アカウント停止・データ削除": "11. Account Suspension and Data Deletion",
  "12. 免責": "12. Disclaimer",
  "13. 料金・プラン内容の変更": "13. Changes to Fees and Plan Details",
  "14. 通知方法": "14. Notice Method",
  "15. 変更・停止": "15. Changes and Suspension",
  "16. 準拠法・管轄": "16. Governing Law and Jurisdiction",
  "利用者は、登録情報を正確に管理し、アカウントや認証情報を第三者に利用させないものとします。":
    "Users must manage their registration information accurately and must not allow third parties to use their account or authentication information.",
  "未成年者は、親権者など法定代理人の同意を得たうえで本サービスを利用するものとします。":
    "Minors must use the service with the consent of a parent or other legal representative.",
  "Free、Pro、Creatorの各プランには、保存中アイテム数とAI分析回数の上限を設定します。AI分析回数の集計期間はプランにより異なる場合があります。保存操作の累計回数には制限を設けませんが、保存中アイテム数が各プランの上限に達している場合、新たな保存ができないことがあります。":
    "The Free, Pro, and Creator plans have limits on the number of saved items and AI analyses. The counting period for AI analyses may differ by plan. There is no cumulative limit on save operations, but new saves may be unavailable if the current number of saved items reaches the plan limit.",
  "有料プランは月額制です。決済、請求、プラン変更、解約などの手続きにはStripeのサービスを利用します。解約した場合でも、契約期間の終了日までは有料プランの機能を利用できます。契約期間終了後はFreeプランへ切り替わります。":
    "Paid plans are monthly subscriptions. Stripe is used for payment, billing, plan changes, cancellation, and related procedures. Even after cancellation, paid plan features remain available until the end of the subscription period. After that period, the account switches to the Free plan.",
  "デジタルサービスの性質上、利用者都合による返金や日割り返金は原則として行いません。ただし、法令上必要な場合、重複決済、運営者の責めに帰すべき事由がある場合は、個別に確認のうえ対応します。":
    "Due to the nature of digital services, refunds or prorated refunds for user convenience are generally not provided. However, cases required by law, duplicate payments, or reasons attributable to the operator will be reviewed individually.",
  "利用者は、所定の手続きによりアカウントを削除できます。有料プラン契約中の場合は、契約期間終了後に削除可能となる場合があります。アカウント削除後、保存投稿、コレクション、タグ、AI分析結果、設定情報などは削除され、元に戻すことはできません。":
    "Users may delete their account through the designated procedure. If a paid subscription is active, account deletion may be available after the subscription period ends. After account deletion, saved posts, collections, tags, AI analysis results, settings, and related data are deleted and cannot be restored.",
  "法令違反、第三者の権利侵害、不正アクセス、サービスへの過度な負荷、APIキーなどの不正利用、その他運営者が不適切と判断する行為を禁止します。":
    "Acts that violate laws, infringe third-party rights, involve unauthorized access, impose excessive load on the service, misuse API keys, or are otherwise deemed inappropriate by the operator are prohibited.",
  "本サービスはOpenAI、Stripe、各SNSなどの外部サービスを利用します。外部サービスの障害、仕様変更、取得情報の欠落、AI出力の正確性について完全性を保証しません。":
    "This service uses external services such as OpenAI, Stripe, and social media platforms. The operator does not guarantee completeness regarding external service failures, specification changes, missing retrieved information, or the accuracy of AI outputs.",
  "利用者は、保存するURL、メモ、画像その他の情報について必要な権利または利用権限を有するものとします。第三者の著作権、肖像権、プライバシー、各SNSの規約その他の権利や条件を侵害しない範囲で利用してください。":
    "Users are responsible for having the necessary rights or permissions for saved URLs, memos, images, and other information. Please use the service within a scope that does not infringe third-party copyrights, portrait rights, privacy, social media terms, or other rights and conditions.",
  "利用者が本規約に違反した場合、不正利用が疑われる場合、またはサービス運営上必要がある場合、運営者は事前通知なくアカウントの利用停止、投稿データの削除、利用制限を行うことがあります。":
    "If a user violates these Terms, if misuse is suspected, or if necessary for service operation, the operator may suspend the account, delete post data, or restrict use without prior notice.",
  "AI分析結果は参考情報であり、事実性、適法性、特定目的への適合性を保証するものではありません。重要な判断は利用者自身で確認してください。":
    "AI analysis results are reference information and do not guarantee factual accuracy, legality, or suitability for a specific purpose. Users should verify important matters themselves.",
  "運営者は、事前に合理的な方法で通知したうえで、プラン内容、料金、保存枠、AI分析回数その他の利用条件を変更できるものとします。":
    "The operator may change plan details, fees, saved item limits, AI analysis limits, and other usage conditions after providing notice by a reasonable method in advance.",
  "運営者から利用者への通知は、アプリ内表示、登録メールアドレスへの送信、Webサイト上での掲載、その他合理的な方法により行います。":
    "Notices from the operator to users will be made by in-app display, email to the registered address, posting on the website, or other reasonable methods.",
  "運営者は、必要に応じて本サービスまたは本規約を変更・停止できます。重要な変更は合理的な方法で通知します。":
    "The operator may change or suspend the service or these Terms as necessary. Important changes will be notified by a reasonable method.",
  "本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。":
    "These Terms are governed by Japanese law. Any dispute related to this service shall be subject to the exclusive jurisdiction of the court having jurisdiction over the operator's location as the court of first instance.",
  "有料プランの販売条件、事業者情報、解約・返金条件などは以下のページで確認できます。":
    "Sales conditions for paid plans, operator information, cancellation and refund conditions, and related matters can be confirmed on the following page.",
  "特商法表記を確認する": "View Legal Notice",
  "1. 取得する情報": "1. Information Collected",
  "2. 利用目的": "2. Purpose of Use",
  "3. AI分析": "3. AI Analysis",
  "4. お問い合わせ": "4. Contact Form",
  "5. Cookie等の利用": "5. Use of Cookies and Similar Technologies",
  "6. 決済情報": "6. Payment Information",
  "7. 外部送信先・海外送信": "7. External Recipients and Overseas Transfer",
  "8. 第三者提供": "8. Third-Party Provision",
  "9. 保存期間と削除": "9. Retention Period and Deletion",
  "10. 安全管理": "10. Security Management",
  "11. 漏えい等が発生した場合の対応": "11. Response to Data Leakage or Similar Incidents",
  "12. 開示・訂正・削除": "12. Disclosure, Correction, and Deletion",
  "は、メールアドレス、表示名、保存URL、メモ、タグ、コレクション、AI分析結果、契約プラン、利用量、決済識別子、お問い合わせフォームに入力された名前、返信先メールアドレス、件名、お問い合わせ内容、添付画像、IPアドレス、User-Agent、操作日時などのログ情報を取得する場合があります。":
    "may collect email addresses, display names, saved URLs, memos, tags, collections, AI analysis results, subscription plan, usage volume, payment identifiers, names entered in the contact form, reply email addresses, subjects, inquiry content, attached images, IP addresses, User-Agent, operation timestamps, and other log information.",
  "サービス提供、保存・検索・AI分析、利用上限の管理、契約・課金管理、不正利用防止、障害調査、品質改善、お問い合わせ対応、自動返信、重要なお知らせや退会完了通知の送信のために利用します。":
    "The information is used to provide the service, save, search, and analyze content with AI, manage usage limits, manage subscriptions and billing, prevent misuse, investigate failures, improve quality, respond to inquiries, send automatic replies, important notices, and account deletion completion notices.",
  "AI分析を実行した場合、対象投稿のURL、タイトル、本文、説明、投稿者情報、画像をOpenAIへ送信します。ユーザーの用途、メモ、ユーザー作成タグ、引用投稿、スレッド情報はAI分析へ送信しません。":
    "When AI analysis is performed, the target post URL, title, body text, description, author information, and images are sent to OpenAI. User purpose, memos, user-created tags, quoted posts, and thread information are not sent for AI analysis.",
  "お問い合わせフォームを送信した場合、入力内容および任意で添付された画像を、問い合わせ対応、内容確認、返信、送信者への自動返信のために利用します。メール送信にはResendを利用する場合があります。":
    "When the contact form is submitted, the entered content and optionally attached images are used for inquiry handling, content confirmation, replies, and automatic replies to the sender. Resend may be used for email delivery.",
  "本サービスは、ログイン状態の維持、セキュリティ、不正利用防止、利用状況の把握のためにCookie、セッション情報、これに類する技術を利用します。":
    "This service uses cookies, session information, and similar technologies to maintain login status, ensure security, prevent misuse, and understand usage status.",
  "決済はStripeが処理します。本サービスはカード番号そのものを保存せず、Stripeの顧客ID、契約ID、Price ID、契約状態を保存します。":
    "Payments are processed by Stripe. This service does not store card numbers themselves, but stores Stripe customer IDs, subscription IDs, Price IDs, and subscription status.",
  "OpenAI、Stripe、Resend、URL情報取得対象となる外部サイトへ、機能提供に必要な範囲で情報を送信します。これらの送信先には、日本国外に所在する事業者が含まれる場合があります。各事業者の取扱いはそれぞれの規約・ポリシーに従います。":
    "Information is sent to OpenAI, Stripe, Resend, and external sites targeted for URL information retrieval to the extent necessary to provide the service. These recipients may include providers located outside Japan. Each provider handles information according to its own terms and policies.",
  "法令に基づく場合、本人の同意がある場合、またはサービス提供に必要な業務委託先へ必要な範囲で取り扱いを委託する場合を除き、本人の同意なく個人情報を第三者に提供しません。":
    "Personal information will not be provided to third parties without the individual's consent, except as required by law, with the individual's consent, or when handling is entrusted to service providers to the extent necessary to provide the service.",
  "利用目的に必要な期間情報を保存します。保存アイテムは利用者が削除できます。アカウント削除後、保存投稿、メモ、タグ、コレクション、AI分析結果、設定情報などは削除されます。ただし、契約・請求、不正対策、障害調査、法令対応に必要な情報は、必要な期間保持する場合があります。":
    "Information is retained for the period necessary for the purposes of use. Saved items can be deleted by the user. After account deletion, saved posts, memos, tags, collections, AI analysis results, settings, and related data are deleted. However, information necessary for contracts, billing, fraud prevention, failure investigation, or legal compliance may be retained for the necessary period.",
  "アクセス制御、秘密情報の環境変数管理、Webhook署名検証など、合理的な安全管理措置を講じます。":
    "Reasonable security measures are implemented, such as access control, environment variable management for secrets, and Webhook signature verification.",
  "個人情報の漏えい、滅失、毀損等が発生した場合、法令に従い、必要に応じて関係機関への報告、本人への通知、再発防止策の実施を行います。":
    "If leakage, loss, damage, or similar incident involving personal information occurs, the operator will take actions required by law, such as reporting to relevant authorities, notifying affected individuals, and implementing recurrence prevention measures as necessary.",
  "保有情報の開示、訂正、削除などを希望する場合は、本人確認に必要な情報を添えてお問い合わせください。":
    "If you wish to request disclosure, correction, deletion, or similar handling of retained information, please contact us with information necessary for identity verification.",
  "Postfolio運営者": "Postfolio Operator",
  "峰芝 駆": "Kakeru Mineshiba",
  "請求があった場合、遅滞なく開示します。":
    "Disclosed without delay upon request.",
  "プラン一覧ページに表示された月額料金に従います。表示価格は税込です。":
    "Fees are based on the monthly prices shown on the Plans page. Displayed prices include tax.",
  "インターネット接続料金、通信料金、振込手数料その他利用者側で発生する費用は利用者の負担となります。":
    "Internet connection fees, communication charges, transfer fees, and other costs incurred by the user are borne by the user.",
  "クレジットカード決済（Stripe）": "Credit card payment (Stripe)",
  "初回申込時および契約更新時に、選択したプランの月額料金が請求されます。":
    "The monthly fee for the selected plan is charged at initial application and at each subscription renewal.",
  "決済完了後、利用可能な状態になり次第すぐに提供します。":
    "The service is provided as soon as it becomes available after payment is completed.",
  "利用者はアプリ内またはStripeの管理画面から解約できます。解約後も契約期間の終了日までは有料プランを利用でき、契約期間終了後にFreeプランへ切り替わります。":
    "Users can cancel from within the app or through Stripe's management screen. Even after cancellation, paid plan features remain available until the end of the subscription period, after which the account switches to the Free plan.",
  "デジタルサービスの性質上、利用開始後の返品、キャンセル、利用者都合による返金、日割り返金は原則として行いません。ただし、法令上必要な場合、重複決済、運営者の責めに帰すべき事由がある場合は個別に対応します。":
    "Due to the nature of digital services, returns, cancellations, refunds for user convenience, and prorated refunds after use begins are generally not provided. However, cases required by law, duplicate payments, or reasons attributable to the operator will be handled individually.",
  "最新版の主要ブラウザでの利用を推奨します。利用端末や通信環境により、一部機能が正常に動作しない場合があります。":
    "Use of the latest major browsers is recommended. Some features may not work properly depending on the device or network environment.",
  "ログアウト": "Log out",
  "ログアウト中...": "Logging out...",
  "ようこそPostfolioへ": "Welcome to Postfolio",
  "気になったSNS投稿を、あとで使えるリサーチ資産として保存・整理できます。":
    "Save and organize the social posts you care about as reusable research assets.",
  "保存したSNS投稿を、次の企画に使える形で整理しましょう。":
    "Organize saved social posts so you can use them in your next idea.",
  "投稿一覧を見る": "View saved posts",
  "分類を整理する": "Organize categories",
  "使い方を確認する": "Learn how to use it",
  "アカウント": "Account",
  "表示名": "Display name",
  "未設定": "Not set",
  "現在のプラン": "Current plan",
  "お支払い状況": "Payment status",
  "次回更新日": "Next renewal date",
  "利用終了予定日": "Access ends on",
  "契約中": "Active",
  "利用状況": "Usage",
  "AI分析は毎月1日にリセットされます。":
    "AI analysis usage resets on the first day of each month.",
  "FreeプランのAI分析は毎日リセットされます。":
    "Free plan AI analysis usage resets daily.",
  "保存枠": "Saved item limit",
  "今月のAI分析": "AI analyses this month",
  "今日のAI分析": "AI analyses today",
  "最近の投稿": "Recent posts",
  "すべて見る": "View all",
  "まだ保存した投稿がありません": "No saved posts yet",
  "最初のURLを保存すると、ここに最近の投稿が表示されます。":
    "Save your first URL and recent posts will appear here.",
  "新規作成": "Create New",
  "新しいURLを保存": "Save a New URL",
  "ページ情報は保存時に自動で取得します。":
    "Page information is fetched automatically when saved.",
  "URL": "URL",
  "対応SNSのURLを入力": "Enter a supported social media URL",
  "メモ": "Memo",
  "なぜ保存したか、どこが参考になったか":
    "Why you saved it, or what you found useful",
  "タグ": "Tags",
  "カンマ区切りで複数入力": "Enter multiple tags separated by commas",
  "キャンセル": "Cancel",
  "保存する": "Save",
  "取得中...": "Fetching...",
  "保存できませんでした。": "Could not save.",
  "検索": "Search",
  "タイトル、メモ、URLで検索": "Search by title, memo, or URL",
  "すべてのコレクション": "All collections",
  "すべてのタグ": "All tags",
  "絞り込む": "Filter",
  "すべて": "All",
  "保存したSNSの投稿を確認できます。": "View your saved social media posts.",
  "条件に合うアイテムがありません": "No items match your filters",
  "最初のURLを保存しましょう": "Save your first URL",
  "気になった投稿を、忘れる前にリサーチ資産へ。":
    "Turn posts you care about into research assets before you forget them.",
  "リサーチメモ": "Research Memo",
  "元の投稿": "Original Post",
  "タイトル": "Title",
  "自分のメモ": "My Memo",
  "参考になったポイントや次のアクション":
    "Useful points or next actions",
  "カンマ区切り": "Comma separated",
  "変更を保存": "Save Changes",
  "保存中...": "Saving...",
  "変更を保存しました。": "Changes saved.",
  "投稿を削除": "Delete Post",
  "この投稿を削除しますか？": "Delete this post?",
  "削除した投稿は元に戻せません。": "Deleted posts cannot be restored.",
  "削除中...": "Deleting...",
  "投稿SNS": "Platform",
  "登録日": "Saved Date",
  "投稿日": "Posted Date",
  "投稿者": "Author",
  "投稿者情報なし": "No author information",
  "AI分析": "AI Analysis",
  "投稿内容をAIが分析します": "AI analyzes the post content",
  "AIで分析": "Analyze with AI",
  "再分析": "Analyze Again",
  "分析中...": "Analyzing...",
  "投稿概要": "Post Overview",
  "分析結果": "Analysis Results",
  "投稿の評価": "Post Rating",
  "まだ分析されていません": "Not analyzed yet",
  "投稿概要、コンテンツの切り口、E〜S段階の投稿評価を生成します。":
    "Generate an overview, content angles, and an E-to-S post rating.",
  "AI分析を実行しますか？": "Run AI analysis?",
  "この投稿をAIで分析します。実行するとAI分析回数を1件消費します。":
    "This will analyze the post with AI and consume one AI analysis credit.",
  "AI分析を実行": "Run AI Analysis",
  "※ AI の回答は必ずしも正しいとは限りません。参考資料としてご確認ください":
    "* AI responses may not always be correct. Please use them as reference material.",
  "新規コレクション": "New Collection",
  "コレクションを作ると、保存した投稿を目的別に整理できます。":
    "Create collections to organize saved posts by purpose.",
  "左側のコレクションを選択すると、登録投稿が表示されます。":
    "Select a collection on the left to view its posts.",
  "コレクションを作成": "Create Collection",
  "コレクションを編集": "Edit Collection",
  "保存": "Save",
  "コレクション一覧へ": "Back to Collections",
  "登録された投稿を確認できます。": "View posts registered in this collection.",
  "まとめて選択": "Bulk select",
  // --- Onboarding (welcome guide + checklist) ---
  "投稿を保存": "Save posts",
  "「新規作成」からURLを貼り付けて、SNS投稿を保存できます。":
    "Save social posts by pasting a URL from New.",
  "整理する": "Organize",
  "コレクションとタグで、投稿を目的別に整理できます。":
    "Organize posts by purpose with collections and tags.",
  "投稿概要・コンテンツの切り口・投稿の評価をAIが生成します。":
    "AI generates a summary, content angles, and a post rating.",
  "スキップ": "Skip",
  "次へ": "Next",
  "始める": "Get started",
  "戻る": "Back",
  "はじめかた": "Getting started",
  "3ステップでPostfolioを使いこなしましょう。":
    "Get the most out of Postfolio in three steps.",
  "最初の投稿を保存する": "Save your first post",
  "AI分析を試す": "Try AI analysis",
  "コレクションを作成する": "Create a collection",
  "コレクションから外す": "Remove from collection",
  "外す": "Remove",
  "選択した投稿をコレクションから外しますか？":
    "Remove the selected posts from the collection?",
  "コレクションから外しますか？": "Remove from collection?",
  "投稿は削除されず、未分類に戻ります。":
    "The post is not deleted; it returns to Uncategorized.",
  "投稿を追加": "Add posts",
  "コレクションに追加": "Add to collection",
  "追加する保存済みの投稿を選んでください。":
    "Pick the saved posts you want to add.",
  "追加できる投稿がありません。": "No posts available to add.",
  "選択した投稿を追加": "Add selected posts",
  "追加中...": "Adding...",
  "追加に失敗しました。": "Failed to add.",
  "閉じる": "Close",
  "現在の有料プランは契約期間の終了時にFreeへ切り替わる予定です。":
    "Your paid plan is scheduled to switch to Free at the end of the billing period.",
  "利用中": "In Use",
  "Freeへ変更": "Change to Free",
  "Freeへ変更予定": "Scheduled to Change to Free",
  "プランの確認と変更ができます。": "Review and change your plan.",
  "Freeプラン：保存30件・AI分析 1日1件":
    "Free plan: 30 saved items, 1 AI analysis per day",
  "AI分析 1日1件": "AI analysis: 1 per day",
  "AI分析 月100件": "AI analysis: 100 per month",
  "AI分析 月200件": "AI analysis: 200 per month",
  "カラー設定を変更できます。": "Change color settings.",
  "知りたい項目を選ぶと、必要な手順だけを確認できます。":
    "Choose a topic to see only the steps you need.",
  "①新規登録": "1. New Registration",
  "②投稿の管理": "2. Post Management",
  "③AI分析": "3. AI Analysis",
  "④プラン": "4. Plans",
  "まず迷ったら": "If you are unsure",
  "使い方のコツ": "Usage Tip",
  "お知らせ": "Announcements",
  "Postfolioからの最新のお知らせを掲載します。":
    "Here are the latest announcements from Postfolio.",
  "すべて既読にする": "Mark all as read",
  "既読にする": "Mark as read",
  "未読": "Unread",
  "処理中...": "Processing...",
  "再試行": "Retry",
  "現在お知らせはありません。": "There are no announcements at this time.",
  "ページネーション": "Pagination",
  // --- Legal pages (terms / privacy) ---
  "最終更新日：": "Last updated: ",
  "2026年6月20日": "June 20, 2026",
  "が提供するSNSリサーチサービス「Postfolio」の利用条件を定めるものです。": ".",
  "4. プランと利用制限": "4. Plans and Usage Limits",
  "各プランには保存中アイテム数とAI分析回数の上限があります。保存操作の累計回数には制限を設けませんが、保存中アイテム数が上限に達している場合、新たな保存ができないことがあります。":
    "Each plan has limits on the number of saved items and AI analyses. There is no cumulative limit on save operations, but new saves may be unavailable when the number of saved items reaches the limit.",
  "有料プランは月額制です。決済、請求、プラン変更、解約などの手続きにはStripeのサービスを利用します。解約後も契約期間の終了日までは有料プランの機能を利用できます。":
    "Paid plans are billed monthly. Payments, billing, plan changes, and cancellations are handled through Stripe. After cancellation, paid features remain available until the end of the current contract period.",
  "デジタルサービスの性質上、利用者都合による返金や日割り返金は原則として行いません。ただし、法令上必要な場合、重複決済、運営者の責めに帰すべき事情がある場合は個別に確認のうえ対応します。":
    "Due to the nature of digital services, refunds or prorated refunds for customer convenience are not provided in principle. However, where required by law, or in cases of duplicate payment or circumstances attributable to the operator, we will review and respond individually.",
  "利用者は、所定の手続きによりアカウントを削除できます。アカウント削除後、保存投稿、コレクション、タグ、AI分析結果、設定情報などは削除され、元に戻すことはできません。有料プラン契約中の場合、契約期間終了後に削除可能となる場合があります。":
    "Users may delete their account through the prescribed procedure. After deletion, saved posts, collections, tags, AI analysis results, and settings are deleted and cannot be restored. If a paid plan is active, deletion may only become possible after the contract period ends.",
  "利用者は、保存するURL、メモ、画像その他の情報について必要な権利または利用権限を有するものとします。第三者の著作権、肖像権、プライバシー、各SNSの規約その他の権利を侵害しない範囲で利用してください。":
    "Users must hold the necessary rights or authorization for the URLs, notes, images, and other information they save. Please use the service without infringing the copyrights, portrait rights, privacy, SNS terms, or other rights of third parties.",
  "サービス提供、保存投稿の検索・AI分析、利用上限の管理、契約・課金管理、不正利用防止、障害調査、品質改善、お問い合わせ対応、自動返信、重要なお知らせや会員登録完了通知の送信のために利用します。":
    "We use it to provide the service, search and AI-analyze saved posts, manage usage limits, manage contracts and billing, prevent misuse, investigate incidents, improve quality, respond to inquiries, send auto-replies, and send important notices and registration-completion notifications.",
  "4. お問い合わせフォーム": "4. Contact Form",
  "お問い合わせフォームを送信した場合、入力内容および任意で添付された画像を、内容確認、返信、送信者への自動返信のために利用します。メール送信にはResendを利用する場合があります。":
    "When you submit the contact form, we use the entered content and any optionally attached images to review the content, reply, and send an auto-reply to the sender. We may use Resend to send emails.",
  "OpenAI、Stripe、Resend、URL情報取得対象となる外部サイトへ、機能提供に必要な範囲で情報を送信します。これらの送信先には、日本国外に所在する事業者が含まれる場合があります。各事業者の取り扱いは、それぞれの規約・ポリシーに従います。":
    "We send information to OpenAI, Stripe, Resend, and the external sites whose URL data is fetched, to the extent necessary to provide features. These recipients may include businesses located outside Japan. Each provider handles data in accordance with its own terms and policies.",
  "9. 保存期間とアカウント削除時の扱い":
    "9. Retention Period and Handling upon Account Deletion",
  "利用目的に必要な期間、情報を保存します。アカウント削除後、保存投稿、メモ、タグ、コレクション、AI分析結果、設定情報などは削除されます。ただし、契約・請求、不正対策、障害調査、法令対応に必要な情報は、必要な期間保持する場合があります。":
    "We retain information for as long as necessary for the purposes of use. After account deletion, saved posts, notes, tags, collections, AI analysis results, and settings are deleted. However, information necessary for contracts and billing, fraud prevention, incident investigation, and legal compliance may be retained for the necessary period.",
  // --- Contact page + form ---
  "Postfolioに関するご質問、不具合報告、ご要望などはこちらからご連絡ください。":
    "For questions, bug reports, or requests about Postfolio, please contact us here.",
  "お問い合わせフォーム": "Contact Form",
  "は必須項目です。": "is a required field.",
  "お名前": "Name",
  "返信先メールアドレス": "Reply-to email address",
  "件名": "Subject",
  "お問い合わせ内容": "Message",
  "画像添付": "Attach images",
  "画像を選択": "Select images",
  "添付可能: jpg、jpeg、png、webp、gif、heic、heif":
    "Allowed: jpg, jpeg, png, webp, gif, heic, heif",
  "ファイル選択": "Choose file",
  "画像は3枚まで添付できます。添付画像は1枚5MBまで、合計10MBまで送信できます。":
    "You can attach up to 3 images. Each image can be up to 5MB, with a total of up to 10MB.",
  "送信する": "Send",
  "●ご連絡時には、こちらの情報を載せて頂けると幸いです":
    "● Please include the following information when you contact us",
  "発生した画面や操作内容": "The screen where it happened and what you were doing",
  "保存しようとしたSNSの種類": "The type of SNS you were trying to save",
  "表示されたエラーメッセージ": "The error message shown",
  "可能であればスクリーンショット": "A screenshot, if possible",
  "例：山田 太郎": "e.g. Taro Yamada",
  "例：your@example.com": "e.g. your@example.com",
  "例：不具合について": "e.g. About a bug",
  "お問い合わせ内容を入力してください": "Enter your inquiry",
  "選択中の画像を解除": "Clear selected images",
  "選択中の画像": "Selected images",
  "送信中...": "Sending...",
  "画像は3枚まで添付できます。": "You can attach up to 3 images.",
  "送信に失敗しました。": "Failed to send.",
  "お問い合わせを送信しました。": "Your inquiry has been sent.",
  "送信に失敗しました。しばらくしてから再度お試しください。":
    "Failed to send. Please try again later.",
};

const reverseTranslations = Object.fromEntries(
  Object.entries(translations).map(([ja, en]) => [en, ja]),
) as Record<string, string>;

const textAttributes = ["placeholder", "aria-label", "title"] as const;

export function LanguageDomTranslator({ language }: { language: AppLanguage }) {
  useEffect(() => {
    const appliedLanguage = document.documentElement.dataset.postfolioLanguage;
    if (language === "ja" && appliedLanguage !== "en") {
      document.documentElement.dataset.postfolioLanguage = "ja";
      return;
    }

    const applyTranslations = () => {
      translateDocument(language);
      document.documentElement.dataset.postfolioLanguage = language;
    };
    applyTranslations();

    if (language === "ja") return;

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(applyTranslations);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}

function translateDocument(language: AppLanguage) {
  const dictionary = language === "en" ? translations : reverseTranslations;
  const root = document.querySelector("main");
  if (!root) return;

  translateTextNodes(root, dictionary);
  translateAttributes(root, dictionary);

  if (process.env.NODE_ENV !== "production" && language === "en") {
    auditUntranslated(root);
  }
}

// Dev-only guardrail (see docs/I18N.md). When viewing English, flag any Japanese
// text left in <main> that has no dictionary entry, so a missing translation is
// caught immediately instead of silently shipping. Mark legitimately dynamic /
// user-generated content with `data-i18n-dynamic` to exclude it.
const auditedTexts = new Set<string>();
function auditUntranslated(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest("[data-i18n-dynamic]")) return NodeFilter.FILTER_REJECT;
      return node.nodeValue?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const missing: string[] = [];
  while (walker.nextNode()) {
    const text = (walker.currentNode.nodeValue ?? "").trim();
    if (!text || auditedTexts.has(text)) continue;
    if (!/[぀-ヿ㐀-鿿]/.test(text)) continue; // no Japanese
    if (translations[text]) continue; // has an entry, would already be translated
    auditedTexts.add(text);
    missing.push(text);
  }

  if (missing.length) {
    console.warn(
      "[i18n] 英語モードで未翻訳の日本語が <main> に見つかりました。" +
        "language-dom-translator.tsx に辞書エントリを追加するか、動的テキストは " +
        "data-i18n-dynamic を付けて除外してください（docs/I18N.md 参照）:",
      missing,
    );
  }
}

function translateTextNodes(root: Element, dictionary: Record<string, string>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const node of textNodes) {
    const original = node.nodeValue ?? "";
    const trimmed = original.trim();
    const translated = dictionary[trimmed];
    if (!translated || translated === trimmed) continue;
    node.nodeValue = original.replace(trimmed, translated);
  }
}

function translateAttributes(root: Element, dictionary: Record<string, string>) {
  const elements = root.querySelectorAll<HTMLElement>("*");
  for (const element of elements) {
    for (const attribute of textAttributes) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const translated = dictionary[value.trim()];
      if (translated) element.setAttribute(attribute, translated);
    }
  }
}
