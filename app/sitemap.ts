import type { MetadataRoute } from "next";
import { getArchive, getBoard } from "@/lib/data/listings";
import { SITE_URL } from "@/lib/domain/site";

/**
 * Every page worth crawling.
 *
 * Listing pages are the only surface that grows, so they are the reason this
 * is generated rather than static. `lastModified` comes from the listing's own
 * claim time, which is real: a listing genuinely changes when it is reclaimed
 * or moves rank. Sending a fabricated "now" for every URL on every crawl is
 * the fastest way to have a crawler stop trusting the field.
 *
 * `priority` is relative within this site only — it does not affect ranking
 * against anyone else, and Google treats it as a weak hint at most.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [board, archived] = await Promise.all([getBoard(), getArchive()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/rules`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/archive`, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const listingUrl = (id: string) => `${SITE_URL}/product/${encodeURIComponent(id)}`;

  // A listing on the board changes often and is worth recrawling; one in the
  // archive is settled, so it is advertised at a lower priority and frequency
  // rather than dropped. Dropping it would orphan a page that still resolves.
  const live: MetadataRoute.Sitemap = board.entries.map((entry) => ({
    url: listingUrl(entry.id),
    lastModified: new Date(entry.claimedAt),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const gone: MetadataRoute.Sitemap = archived.map((listing) => ({
    url: listingUrl(listing.id),
    lastModified: new Date(listing.claimedAt),
    changeFrequency: "monthly",
    priority: 0.3,
  }));

  return [...staticRoutes, ...live, ...gone];
}
