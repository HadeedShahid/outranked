import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/domain/site";

/**
 * Crawl rules.
 *
 * Disallow is deliberately narrow, and it is not a way to hide a page:
 * blocking a URL here does not keep it out of the index — Google can still
 * list a blocked URL it finds linked elsewhere, just without a snippet.
 * Anything that must stay out of results needs a `noindex` on the page itself.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Endpoints, not pages. Nothing here renders anything a person reads.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
