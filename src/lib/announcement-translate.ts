// Generates an English version of an announcement at write time so the public
// page can swap languages instantly without per-view API calls. Any failure
// (missing key, timeout, API error) resolves to nulls so posting never breaks;
// the page then falls back to the Japanese text.

type Translation = { titleEn: string | null; bodyEn: string | null };

type ResponsesPayload = {
  output?: Array<{ content?: Array<{ type: string; text?: string }> }>;
  error?: { message?: string };
};

export async function translateAnnouncementToEnglish(input: {
  title: string;
  body: string;
}): Promise<Translation> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { titleEn: null, bodyEn: null };

  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
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
              "You are a professional Japanese-to-English translator for product announcements. Translate naturally and concisely. Preserve line breaks and any URLs exactly. Do not add or omit information.",
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Translate this announcement to English.\nTitle: ${input.title}\nBody:\n${input.body}`,
              },
            ],
          },
        ],
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "announcement_translation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                body: { type: "string" },
              },
              required: ["title", "body"],
            },
          },
        },
        max_output_tokens: 1200,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const result = (await response.json()) as ResponsesPayload;
    if (!response.ok) return { titleEn: null, bodyEn: null };

    const text = result.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text")?.text;
    if (!text) return { titleEn: null, bodyEn: null };

    const parsed = JSON.parse(text) as { title?: string; body?: string };
    return {
      titleEn: parsed.title?.trim() || null,
      bodyEn: parsed.body?.trim() || null,
    };
  } catch {
    return { titleEn: null, bodyEn: null };
  } finally {
    clearTimeout(timeout);
  }
}
