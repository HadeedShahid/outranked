"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackClick } from "@/lib/api-client/listings";

interface ListingLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  listingId: string;
}

/**
 * Outbound link that records a click. Fire-and-forget is safe here only
 * because the link opens in a new tab, so this page never unloads and the
 * request can't be cancelled mid-flight.
 */
export function ListingLink({ listingId, ...props }: ListingLinkProps) {
  return (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackClick(listingId).catch(() => {});
      }}
    />
  );
}
