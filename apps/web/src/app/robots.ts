import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public pages are crawlable; signed-in areas aren't (they only redirect to /login). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/settings",
        "/portfolio",
        "/watchlist",
        "/alerts",
        "/signal-alerts",
        "/simulation",
        "/bulletins",
        "/auth/",
        "/reset-password",
        "/error",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
