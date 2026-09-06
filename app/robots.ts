import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/domain/site";

/**
 * Crawl rules.
 *
 * Disallow is deliberately narrow. Blocking a URL in robots.txt does not keep
 * it out of the index — Google can still list a blocked URL it finds linked
 * elsewhere, just without a snippet. Anything that must stay out of results
 * needs a `noindex` on the page itself, which is why /theme-lab carries one
 * as well as sitting here.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Endpoints, not pages. Nothing here renders anything a person reads.
          "/api/",
          // Internal design scratch page.
          "/theme-lab",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
