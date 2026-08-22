import { z } from "zod";

const analysisSchema = z.object({
  summary: z.string().min(1).max(500),
  rating: z.enum(["S", "A", "B", "C", "D", "E"]),
  growthReason: z.string().min(1).max(800),
  contentAngles: z.array(z.string().min(1).max(160)).min(1).max(6),
  reuseSuggestion: z.string().min(1).max(1200),
});

export type AiAnalysis = z.infer<typeof analysisSchema>;

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      description: "投稿内容を日本語で簡潔にまとめた投稿概要",
    },
    rating: {
      type: "string",
      enum: ["S", "A", "B", "C", "D", "E"],
      description:
        "投稿そのものの総合評価。閲覧数、いいね、再投稿、コメント数、コメント内容、本文、画像、構成、共感性を根拠に評価する。再利用しやすさは評価基準に含めない",
    },
    growthReason: {
      type: "string",
      description:
        "投稿評価の根拠。高評価では反応や内容面で良かった点を、低評価では伸びにくい理由や改善点を日本語で記述する。再利用観点ではなく投稿自体を評価する",
    },
    contentAngles: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 6,
      description: "記事やSNS投稿へ展開できる切り口",
    },
    reuseSuggestion: {
      type: "string",
      description:
        "再利用アイデアを3〜5個、箇条書き形式で具体的にまとめた日本語テキスト",
    },
  },
  required: [
    "summary",
    "rating",
    "growthReason",
    "contentAngles",
    "reuseSuggestion",
  ],
} as const;

type OpenAiResponse = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: { message?: string };
};

export class OpenAiConfigurationError extends Error {}
export class OpenAiRequestError extends Error {}

export async function analyzeSavedItem(input: {
  url: string;
  platform: string;
  title: string | null;
  description: string | null;
  authorName: string | null;
  postText: string | null;
  mediaUrls: string[];
  thumbnailUrl: string | null;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAiConfigurationError(
      "OPENAI_API_KEYが設定されていません。.envにAPIキーを追加してください。",
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const imageUrls = [
      ...new Set([...input.mediaUrls, input.thumbnailUrl].filter(Boolean)),
    ].slice(0, 4) as string[];
    const engagementSignals = extractEngagementSignals([
      input.title,
      input.description,
      input.postText,
    ]);
    const inputText = [
      "次のSNS投稿を分析してください。",
      "「投稿の評価」は、投稿そのものの評価です。再利用しやすいかどうかでは評価しないでください。",
      "投稿評価はS/A/B/C/D/Eです。Sが最高、Eが最低です。",
      "評価基準は、閲覧数、いいね数、再投稿数、コメント数、コメント内容、本文、画像、構成、分かりやすさ、共感性、独自性です。",
      "反応指標が取得できる場合は優先してください。不明な数値やコメントは推測しないでください。",
      "反応指標が不足する場合は、投稿本文、画像、構成、分かりやすさ、共感性、独自性を補助基準として評価してください。",
      "growthReasonには、投稿の評価根拠を書いてください。高評価なら良かった点、低評価なら伸びにくい理由や改善点を中心に書いてください。",
      "再利用観点はgrowthReasonやratingには入れず、reuseSuggestionだけに分けてください。",
      "reuseSuggestionには「再利用するなら？」への回答として、具体的な再利用アイデアを3〜5個挙げてください。",
      "reuseSuggestionは必ず箇条書きにしてください。各行は「・」から始めてください。",
      "各アイデアは、何に使えるか、どう使うかが分かる具体的な内容にしてください。",
      "アイデアを出す際は、次の4観点を踏まえてください。1. 再利用できるか。2. 再利用する価値はあるか。3. 再利用のアイデアが多く思いつくか。4. AI生成時の材料として使えるのか。",
      "単なる評価コメントではなく、実際に使える案を優先してください。",
      `URL: ${input.url}`,
      `プラットフォーム: ${input.platform}`,
      `タイトル: ${input.title || "取得できていません"}`,
      `投稿本文: ${input.postText || input.description || "取得できていません"}`,
      `説明: ${input.description || "取得できていません"}`,
      `投稿者: ${input.authorName || "取得できていません"}`,
      `確認できる反応指標: ${
        engagementSignals.length
          ? engagementSignals.join(" / ")
          : "取得できていません"
      }`,
    ].join("\n");

    const requestOpenAi = (urls: string[]) =>
      fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          reasoning: { effort: "low" },
          input: [
            {
              role: "system",
              content:
                "あなたは日本語のSNSマーケティング、コンテンツ企画、記事制作に詳しい編集者です。与えられた情報だけを根拠に、投稿そのものの評価と、別枠の再利用アイデアを作成してください。不明な数値やコメントは創作しないでください。",
            },
            {
              role: "user",
              content: [
                { type: "input_text", text: inputText },
                ...urls.map((imageUrl) => ({
                  type: "input_image",
                  image_url: imageUrl,
                })),
              ],
            },
          ],
          text: {
            verbosity: "low",
            format: {
              type: "json_schema",
              name: "sns_research_analysis",
              strict: true,
              schema: jsonSchema,
            },
          },
          max_output_tokens: 1400,
        }),
        signal: controller.signal,
        cache: "no-store",
      });

    let response = await requestOpenAi(imageUrls);
    let result = (await response.json()) as OpenAiResponse;

    if (!response.ok && imageUrls.length && shouldRetryWithoutImages(response, result)) {
      response = await requestOpenAi([]);
      result = (await response.json()) as OpenAiResponse;
    }

    if (!response.ok) {
      throw new OpenAiRequestError(
        result.error?.message || "OpenAI APIの呼び出しに失敗しました。",
      );
    }

    const text = result.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text")?.text;
    if (!text) {
      throw new OpenAiRequestError("AI分析結果を取得できませんでした。");
    }

    return analysisSchema.parse(JSON.parse(text));
  } catch (error) {
    if (
      error instanceof OpenAiConfigurationError ||
      error instanceof OpenAiRequestError
    ) {
      throw error;
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      throw new OpenAiRequestError("AI分析結果の形式を確認できませんでした。");
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenAiRequestError("AI分析がタイムアウトしました。");
    }
    throw new OpenAiRequestError("AI分析中にエラーが発生しました。");
  } finally {
    clearTimeout(timeout);
  }
}

function shouldRetryWithoutImages(response: Response, result: OpenAiResponse) {
  const message = result.error?.message?.toLowerCase() ?? "";
  return (
    [400, 403, 404, 422].includes(response.status) &&
    [
      "image",
      "input_image",
      "invalid image",
      "download",
      "unsupported image",
      "forbidden",
      "access denied",
      "403",
      "404",
    ].some((keyword) => message.includes(keyword))
  );
}

function extractEngagementSignals(values: Array<string | null>) {
  const text = values.filter(Boolean).join(" ");
  const matches = text.match(
    /(?:[\d,.]+(?:万|億|[kKmM])?\s*(?:likes?|comments?|views?|shares?|reposts?|retweets?))|(?:(?:いいね|コメント|再生|表示|閲覧|シェア|共有|リポスト|返信)[数回]?\s*[:：]?\s*[\d,.]+(?:万|億)?)/gi,
  );

  return [...new Set(matches?.map((value) => value.trim()) ?? [])].slice(0, 8);
}
