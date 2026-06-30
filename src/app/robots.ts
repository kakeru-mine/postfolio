import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
  "https://postfolioapp.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private app areas, login-gated pages, and token URLs should not be
      // crawled or indexed.
      disallow: [
        "/api/",
        "/admin/",
        "/items",
        "/collections",
        "/settings",
        "/pricing",
        "/generate",
        "/generated",
        "/verify-email",
        "/reset-password",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
