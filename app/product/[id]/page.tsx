import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getListing } from "@/lib/data/listings";
import { displayHost } from "@/lib/domain/url";
import { RelativeTime } from "@/components/listing/relative-time";
import { ListingAvatar } from "@/components/listing/listing-avatar";
import { ListingLink } from "@/components/listing/listing-link";

/**
 * The shell prerenders; the listing streams. `params` is request data, so
 * awaiting it in the page body would block the route from prerendering at all.
 */
export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(decodeURIComponent(id));

  if (!listing) notFound();

  const isLive = listing.rank !== null;

  return (
    <>
      <div className="flex items-start gap-4">
        <ListingAvatar listing={listing} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{listing.title}</h1>
          {listing.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>{displayHost(listing.url)}</span>
            <span aria-hidden>·</span>
            <span>joined <RelativeTime iso={listing.firstClaimAt} /></span>
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="gap-0 border border-border p-4 ring-0">
          <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Position
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {isLive ? `#${listing.rank}` : "—"}
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">
            {isLive ? "on the board" : "in the archive"}
          </dd>
        </Card>

        <Card className="gap-0 border border-border p-4 ring-0">
          <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Clicks
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {listing.clickCount.toLocaleString()}
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">Sent from this board</dd>
        </Card>

        <Card className="gap-0 border border-border p-4 ring-0">
          <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Last claimed
          </dt>
          <dd className="mt-1 text-2xl font-semibold">
            <RelativeTime iso={listing.claimedAt} />
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">
            {isLive ? "Protected for 24h from then" : "Before it dropped off"}
          </dd>
        </Card>
      </dl>

      <div className="flex flex-wrap gap-3">
        <ListingLink
          listingId={listing.id}
          href={listing.url}
          className={cn(buttonVariants({ size: "lg" }), "h-10 px-5")}
        >
          Visit {displayHost(listing.url)}
        </ListingLink>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-5")}>
          Back to the board
        </Link>
      </div>
    </>
  );
}

function ProductSkeleton() {
  return (
    <>
      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-64" />
    </>
  );
}
