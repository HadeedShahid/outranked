import Link from "next/link";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { displayHost } from "@/lib/domain/url";
import type { BoardEntry } from "@/lib/types/board";
import { billingName, billingTagline } from "@/lib/utils/billing-name";
import { ListingAvatar } from "@/components/listing/listing-avatar";
import { ListingLink } from "@/components/listing/listing-link";
import { ClaimButton } from "./claim-button";
import { Countdown } from "./countdown";

/**
 * Poster-style billing for the top three.
 *
 * Top billing is a paid contractual position in film, so the metaphor already
 * reads as "who holds the top slot" — and unlike a spotlight it is natively
 * ordinal: rank is carried by type size and running order, which makes 2nd and
 * 3rd structural rather than bolted on. Pure type, nothing to load.
 */
export function TopBilling({ entries }: { entries: BoardEntry[] }) {
  const [first, second, third] = entries;
  if (!first) return null;

  return (
    <section className="w-full border-b border-border pb-6 sm:pb-8">
      <div className="flex flex-col items-center gap-2.5 px-4 text-center">
        {/* Ordinal, mark, name on one line — the same order as #2/#3, at poster
            scale. One custom property drives both the type size and the mark so
            the two cannot drift apart: the mark matches the name's line box
            (0.92em here), which is what makes them read as a single lockup. */}
        <span className="-mb-1 font-mono text-sm font-bold text-[var(--brand-text)]">
          #{first.rank}
        </span>

        <div className="flex max-w-full items-center gap-3 [--billing:clamp(2rem,9vw,6rem)] sm:gap-4">
          <ListingAvatar
            listing={first}
            size="lg"
            eager
            className="size-[max(3rem,calc(var(--billing)*0.92))] text-[max(1.25rem,calc(var(--billing)*0.4))]"
          />

          <Link
            href={`/product/${first.id}`}
            className="min-w-0 break-words text-[length:var(--billing)] font-black uppercase leading-[0.92] tracking-[-0.035em] transition-opacity hover:opacity-70"
          >
            {billingName(first.title)}
          </Link>
        </div>

        {billingTagline(first.title) && (
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            {billingTagline(first.title)}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {first.clickCount.toLocaleString()} clicks
        </p>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <ListingLink
            listingId={first.id}
            href={first.url}
            className={cn(buttonVariants({ size: "lg" }), "h-10 px-6")}
          >
            Visit {displayHost(first.url)}
          </ListingLink>

          {first.claimable ? (
            <ClaimButton slot={1} expectedListingId={first.id} label="Take #1" variant="outline" size="lg" className="h-10 px-5" />
          ) : (
            <span className="px-3 text-sm text-muted-foreground">
              #1 opens in <Countdown target={first.unfreezeEarliest} />
            </span>
          )}
        </div>
      </div>

      {(second || third) && (
        <>
          <Separator className="mx-auto mt-5 max-w-3xl sm:mt-6" />
          <div className="mx-auto grid max-w-3xl grid-cols-2 items-start gap-3 pt-5 sm:gap-10 sm:pt-6">
            {second && <BillingSupport entry={second} />}
            {third && <BillingSupport entry={third} />}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Runner-up billing.
 *
 * Two shapes from one tree, not two copies of the markup:
 *
 * - Under `sm` it is a podium — ordinal above mark above name, centred, two
 *   up. A column that narrow cannot hold a horizontal row without the name
 *   collapsing to a few characters.
 * - From `sm` up it goes back to a row — ordinal, mark, then name over a
 *   single meta line — because at that width the row reads better and takes
 *   less height.
 *
 * The direction switches on the two flex containers; nothing is duplicated and
 * hidden, so there is only ever one claim button per slot in the document.
 */
function BillingSupport({ entry }: { entry: BoardEntry }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-3 sm:text-left">
      <span className="font-mono text-[11px] font-bold text-[var(--brand-text)]">
        #{entry.rank}
      </span>

      <ListingAvatar listing={entry} size="md" eager />

      <div className="flex min-w-0 flex-col items-center gap-1.5 sm:items-start sm:gap-0">
        {/* The fixed box only exists on the podium, where a wrapped name in one
            column would otherwise push its clicks and countdown a line below
            the other column's. */}
        <div className="flex min-h-[2.4em] w-full items-center justify-center sm:block sm:min-h-0">
          <Link
            href={`/product/${entry.id}`}
            className="line-clamp-2 break-words text-sm font-bold uppercase leading-[1.15] tracking-[-0.01em] transition-opacity hover:opacity-70 sm:line-clamp-none sm:truncate sm:text-[clamp(1rem,2.8vw,1.5rem)] sm:leading-tight"
          >
            {billingName(entry.title)}
          </Link>
        </div>

        <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground sm:mt-0.5 sm:flex-row sm:items-center sm:gap-1.5 sm:text-xs">
          <span className="font-mono sm:font-sans">
            {entry.clickCount.toLocaleString()} clicks
          </span>

          <span aria-hidden className="hidden sm:inline">
            ·
          </span>

          {entry.claimable ? (
            <ClaimButton
              slot={entry.rank}
              expectedListingId={entry.id}
              label={`Take #${entry.rank}`}
              variant="accent"
              size="xs"
            />
          ) : (
            <span className="whitespace-nowrap">
              opens in <Countdown target={entry.unfreezeEarliest} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
