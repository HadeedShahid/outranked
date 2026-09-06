import { Suspense } from "react";
import { getBoard } from "@/lib/data/listings";
import { isSupabaseConfigured } from "@/lib/supabase/client";
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-5 sm:px-6">
      {board.liveCount === 0 ? (
        <section className="flex flex-col items-center gap-4 py-20 text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight sm:text-5xl">
            The board is empty
          </h1>
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
