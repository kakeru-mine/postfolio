import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUrl(input: string) {
  const url = new URL(input);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  for (const key of [...url.searchParams.keys()]) {
    if (
      key.startsWith("utm_") ||
      ["fbclid", "gclid", "igshid", "si"].includes(key)
    ) {
      url.searchParams.delete(key);
    }
  }

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

export function parseTags(value: string | null | undefined) {
  return [
    ...new Set(
      (value ?? "")
        .split(/[,\n、]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
  ];
}
