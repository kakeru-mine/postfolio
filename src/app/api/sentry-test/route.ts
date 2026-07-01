// TEMPORARY: Sentry verification endpoint. Delete after confirming events arrive.
// Accessing this route throws on the server, which Next.js forwards to
// instrumentation's onRequestError (Sentry) and returns a 500.
export const dynamic = "force-dynamic";

export function GET() {
  throw new Error("Sentry server test error (safe to ignore)");
}
