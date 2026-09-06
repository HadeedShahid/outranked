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
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 pt-5 sm:grid-cols-2 sm:gap-10 sm:pt-6">
            {second && <BillingSupport entry={second} />}
            {third && <BillingSupport entry={third} />}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Runner-up billing. Laid out horizontally — mark, then ordinal and name on one
 * line, then a single meta line — because stacking five centred elements cost
 * roughly twice the height for the same information.
 */
function BillingSupport({ entry }: { entry: BoardEntry }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Outside the mark, not between it and the name: sharing a baseline with
          the name pinned it to the top of the block and left it looking loose. */}
      <span className="font-mono text-[11px] font-bold text-[var(--brand-text)]">
        #{entry.rank}
      </span>

      <ListingAvatar listing={entry} size="md" eager />

      <div className="min-w-0 text-left">
        <Link
          href={`/product/${entry.id}`}
          className="block truncate text-[clamp(1rem,2.8vw,1.5rem)] font-bold uppercase leading-tight tracking-[-0.02em] transition-opacity hover:opacity-70"
        >
          {billingName(entry.title)}
        </Link>

        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{entry.clickCount.toLocaleString()} clicks</span>
          <span aria-hidden>·</span>
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
