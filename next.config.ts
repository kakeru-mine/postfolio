import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

// Only apply Sentry's build plugin when configured, so local/dev builds (no DSN)
// stay untouched. Readable stack traces (source-map upload) additionally need
// SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT in the environment.
export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
