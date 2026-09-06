import Link from "next/link";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BoardEntry } from "@/lib/types/board";
import { RelativeTime } from "@/components/listing/relative-time";
import { ListingAvatar } from "@/components/listing/listing-avatar";
import { ListingLink } from "@/components/listing/listing-link";
import { ClaimButton } from "./claim-button";
import { Countdown } from "./countdown";

/**
 * One row of the board. Every slot is contestable, so each row carries either
 * a way to take it or the time until it can be taken.
 */
export function RankRow({ entry }: { entry: BoardEntry }) {
  return (
    <li>
      <Card className="flex-row items-center gap-3 border border-border px-3 py-3 ring-0 transition-colors hover:border-muted-foreground/40 sm:gap-4 sm:px-4">
        <span className="w-8 shrink-0 text-center font-mono text-sm font-bold tabular-nums text-muted-foreground">
          {entry.rank}
        </span>

        <ListingAvatar listing={entry} size="md" />

        <div className="min-w-0 flex-1">
          <Link
            href={`/product/${entry.id}`}
            className="block truncate text-sm font-semibold hover:underline sm:text-base"
          >
            {entry.title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {entry.description || entry.id}
          </p>
        </div>

        <div className="hidden shrink-0 text-right text-xs text-muted-foreground lg:block">
          {entry.clickCount.toLocaleString()} clicks
          <span className="block"><RelativeTime iso={entry.claimedAt} /></span>
        </div>

        <div className="shrink-0 text-right text-xs">
          {entry.claimable ? (
            <ClaimButton
              slot={entry.rank}
              expectedListingId={entry.id}
              label="Take"
              variant="accent"
              size="sm"
            />
          ) : (
            <span className="text-muted-foreground">
              <Countdown target={entry.unfreezeEarliest} />
            </span>
          )}
        </div>

        <ListingLink
          listingId={entry.id}
          href={entry.url}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden shrink-0 sm:inline-flex")}
        >
          Visit
        </ListingLink>
      </Card>
    </li>
  );
}
