import * as Sentry from "@sentry/nextjs";

// Edge runtime (middleware, edge routes). Inert until SENTRY_DSN is set.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
  debug: false,
});
