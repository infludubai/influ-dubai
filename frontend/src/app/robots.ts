import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Gated areas and one-time token links must never be crawled.
        disallow: [
          "/dashboard/",
          "/admin/",
          "/onboarding",
          "/messages",
          "/login",
          "/register",
          "/reset-password",
          "/verify-email",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
