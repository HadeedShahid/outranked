"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackClick } from "@/lib/api-client/listings";
import { withUtm } from "@/lib/domain/url";

interface ListingLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  listingId: string;
}

/**
 * Outbound link that records a click. Fire-and-forget is safe here only
 * because the link opens in a new tab, so this page never unloads and the
 * request can't be cancelled mid-flight.
 *
 * The `rel` is load-bearing, not boilerplate:
 *
 * - `ugc` marks these as user-generated, which is exactly what they are —
 *   anyone can put a link here for free, with no review.
 * - `nofollow` stops the link passing ranking credit. Without it, a free board
 *   that publishes an arbitrary outbound link on demand is a link scheme by
 *   Google's own definition, and the penalty lands on this site, not the
 *   linked one. It also removes the incentive to claim a spot purely to farm
 *   a backlink, which is the failure mode that kills free directories.
 * - `noopener noreferrer` is the security half: it denies the opened page a
 *   handle on this window and withholds the referrer.
 */
export function ListingLink({ listingId, href, ...props }: ListingLinkProps) {
  return (
    <a
      {...props}
      // Tagged here rather than at each call site, so a new place to show a
      // listing cannot forget it.
      href={href ? withUtm(href) : undefined}
      target="_blank"
      rel="nofollow ugc noopener noreferrer"
      onClick={() => {
        trackClick(listingId).catch(() => {});
      }}
    />
  );
}
