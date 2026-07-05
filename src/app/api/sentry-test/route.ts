// TEMPORARY: Sentry verification endpoint. Delete after confirming the stack
// trace resolves to this source file (source maps working). Accessing this route
// throws on the server, which Next.js forwards to instrumentation's
// onRequestError (Sentry) and returns a 500.
export const dynamic = "force-dynamic";

export function GET() {
  throw new Error("Sentry sourcemap test error (safe to ignore)");
}
