import { NextRequest } from "next/server";

// Client identity for abuse investigation. On Vercel the real client IP is in
// x-forwarded-for (first hop); fall back to x-real-ip.
export function getClientInfo(request: NextRequest): {
  ip: string;
  ua: string;
  referer: string;
} {
  const h = request.headers;
  const forwarded = h.get("x-forwarded-for") ?? "";
  const ip =
    forwarded.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return {
    ip,
    ua: h.get("user-agent") ?? "unknown",
    referer: h.get("referer") ?? "",
  };
}

// One-line, greppable auth event log. Filter Vercel logs by "[auth]" to trace
// unexpected signups back to an IP / user-agent / referer.
export function logAuthEvent(
  event: string,
  info: { ip: string; ua: string; referer: string },
  extra: Record<string, unknown> = {},
): void {
  console.log(
    `[auth] ${event} ${JSON.stringify({
      ip: info.ip,
      ua: info.ua,
      referer: info.referer,
      ...extra,
    })}`,
  );
}
