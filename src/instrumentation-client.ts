import * as Sentry from "@sentry/nextjs";

// Client-side (browser) error monitoring. Inert until NEXT_PUBLIC_SENTRY_DSN is
// set. Session Replay is left off to conserve quota; can be enabled later.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
