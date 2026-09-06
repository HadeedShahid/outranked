import { Suspense } from "react";
import Link from "next/link";
import { getArchive } from "@/lib/data/listings";
import { RelativeTime } from "@/components/listing/relative-time";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingAvatar } from "@/components/listing/listing-avatar";

export const metadata = { title: "Archive · outrank" };

/**
 * Everyone pushed off the board by newer claims. Browsable and linked rather
 * than deep-linked only: these are real pages for real businesses, and they
 * stay worth linking to after a listing drops off.
 */
export default function ArchivePage() {

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Archive</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pushed off the board by newer claims. Every listing keeps its page —
          and any of them can claim a spot again.
        </p>
      </header>

      <Suspense fallback={<ArchiveSkeleton />}>
        <ArchiveList />
      </Suspense>
    </main>
  );
}

async function ArchiveList() {
  const listings = await getArchive();

  return (
    <>
      {listings.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nothing here yet. Listings arrive once the board fills up.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {listings.map((listing) => (
            <li key={listing.id}>
              <Card className="flex-row items-center gap-4 border border-border px-4 py-3 ring-0">
                <span className="shrink-0">
                  <ListingAvatar listing={listing} size="md" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${listing.id}`}
                    className="block truncate font-semibold hover:underline"
                  >
                    {listing.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {listing.description || listing.id}
                  </p>
                </div>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  held <RelativeTime iso={listing.claimedAt} />
                </span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ArchiveSkeleton() {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i}><Skeleton className="h-[72px] w-full" /></li>
      ))}
    </ul>
  );
}
