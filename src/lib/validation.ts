import { z } from "zod";

const optionalId = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().cuid().nullable().optional(),
);

export const savedItemCreateSchema = z.object({
  url: z
    .string()
    .url("正しいURLを入力してください。")
    .max(2048)
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
      message: "http または https のURLを入力してください。",
    }),
  memo: z.string().max(5000).optional().default(""),
  purpose: z.string().max(200).optional().default(""),
  collectionId: optionalId,
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

export const savedItemUpdateSchema = z.object({
  title: z.string().max(300).nullable().optional(),
  memo: z.string().max(5000).nullable().optional(),
  purpose: z.string().max(200).nullable().optional(),
  collectionId: optionalId,
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const collectionSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください。").max(80),
  description: z.string().max(500).optional().default(""),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .default("#6C63FF"),
});

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
  message: "カラーコードは #123456 の形式で入力してください。",
});

export const themeSchema = z.object({
  background: hexColorSchema,
  main: hexColorSchema,
  accent: hexColorSchema,
  sidebar: hexColorSchema,
});
