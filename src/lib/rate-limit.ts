// Best-effort in-memory rate limiter (sliding fixed window per key).
//
// On serverless (Vercel) each warm instance keeps its own counters, so this
// throttles bursts routed to a single instance rather than enforcing a global
// limit. It is a cheap pre-launch defense against automated signup floods from
// a single source; for a hard global guarantee, back this with Redis/DB later.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  // Occasionally drop expired buckets so the map cannot grow unbounded.
  if (buckets.size > 5000) sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}
