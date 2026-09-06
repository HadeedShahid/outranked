import { Suspense } from "react";
import { getBoard } from "@/lib/data/listings";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/domain/site";
import { billingName } from "@/lib/utils/billing-name";
import { JsonLd } from "@/lib/seo/json-ld";
import { BoardRows } from "@/components/board/board-rows";
import { ClaimButton } from "@/components/board/claim-button";
import { TopBilling } from "@/components/board/top-billing";
import { ArchiveStrip } from "@/components/board/archive-strip";
import { ArchiveStripSkeleton } from "@/components/board/archive-strip-skeleton";

/**
 * The board is fetched on the server and blocks the response, so the HTML
 * arrives complete — no skeleton, no pop-in. `instant = false` opts this route
 * out of the prerendered-shell requirement that Cache Components applies by
 * default; without it, uncached data outside a Suspense boundary is an error.
 *
 * The archive still streams: it sits below the fold and would otherwise shift
 * the page as it lands.
 */
export const instant = false;

export default async function BoardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 py-24 text-center">
        <h1 className="text-xl font-bold">Database not connected</h1>
        <p className="text-sm text-muted-foreground">
          Set <code className="font-mono">SUPABASE_URL</code> and{" "}
          <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
          <code className="font-mono">.env.local</code>.
        </p>
      </main>
    );
  }

  const board = await getBoard();

  // Offer the best spot going, not the back of the queue. When that spot is
  // occupied we send its current holder as `expectedListingId`, so the server
  // can tell if the board moved between render and submit.
  const bestEntry = board.entries.find((entry) => entry.rank === board.bestOpenSlot);
  const joinLabel =
    board.bestOpenSlot <= board.liveCount
      ? `Claim spot #${board.bestOpenSlot}`
      : `Join the board — spot #${board.bestOpenSlot}`;

  // No SearchAction: that requires a results page a crawler can hit, and search
  // here is a dialog with no URL of its own. Declaring one would be a claim the
  // site cannot honour.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "ItemList",
        name: `The ${SITE_NAME} board`,
        description: "Live standings, best position first.",
        numberOfItems: board.entries.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: board.entries.map((entry) => ({
          "@type": "ListItem",
          position: entry.rank,
          name: billingName(entry.title),
          url: `${SITE_URL}/product/${encodeURIComponent(entry.id)}`,
        })),
      },
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-5 sm:px-6">
      <JsonLd data={structuredData} />

      {/* The poster treatment gives the page no heading of its own — the
          largest text on it is a third-party brand name that changes daily,
          which is the wrong thing for both a crawler and a screen reader to
          receive as the page's title. This states what the page actually is,
          without touching the visual design. */}
      <h1 className="sr-only">
        {SITE_NAME} — {SITE_DESCRIPTION}
      </h1>

      {board.liveCount === 0 ? (
        <section className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-3xl font-black uppercase tracking-tight sm:text-5xl">
            The board is empty
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Nobody has claimed a spot yet. Take #1 and hold it for 24 hours.
          </p>
          <ClaimButton slot={1} expectedListingId={null} label="Take #1" variant="default" size="lg" className="h-11 px-8" />
        </section>
      ) : (
        <>
          <TopBilling entries={board.entries.slice(0, 3)} />

          <div className="flex flex-col items-center gap-2 text-center">
            <ClaimButton
              slot={board.bestOpenSlot}
              expectedListingId={bestEntry?.id ?? null}
              label={joinLabel}
              variant="default"
              size="lg"
              className="h-11 px-8"
            />
            <p className="text-xs text-muted-foreground">
              Free. Every spot is protected for 24 hours once it&apos;s taken.
            </p>
          </div>

          <BoardRows rows={board.entries.slice(3)} />

          <Suspense fallback={<ArchiveStripSkeleton />}>
            <ArchiveStrip />
          </Suspense>
        </>
      )}
    </main>
  );
}
