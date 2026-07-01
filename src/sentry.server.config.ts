import * as Sentry from "@sentry/nextjs";

// Server-side error monitoring. Inert until SENTRY_DSN is set (e.g. in Vercel),
// so local/dev and unconfigured environments report nothing.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
  // Don't spam the dashboard with logs; capture errors/exceptions only.
  debug: false,
});
