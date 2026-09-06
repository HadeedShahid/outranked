import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchListingMetadata } from "@/lib/domain/metadata";
import { normalizeTarget } from "@/lib/domain/url";
import { FREEZE_SECONDS } from "@/lib/domain/rules";
import {
  generateOwnerToken,
  hashOwnerToken,
  ownerTokenMatches,
} from "@/lib/domain/ownership";
import type {
  Board,
  BoardEntry,
  ClaimErrorCode,
  ClaimInput,
  ClaimResult,
  Listing,
} from "@/lib/types/board";

/**
 * Server-side data access. Everything above this layer is database-agnostic.
 *
 * Reads go through the `board_live` / `board_archived` views, which compute
 * rank and expose `claimable` as a boolean while never selecting the true
 * freeze expiry — the leak is prevented structurally rather than by remembering
 * to write careful queries.
 */

interface BoardRow {
  rank: number;
  id: string;
  url: string;
  title: string;
  description: string;
  image_url: string | null;
  first_claim_at: string;
  click_count: number;
  claimed_at: string;
  unfreeze_earliest: string;
  claimable: boolean;
}

const BOARD_COLUMNS =
  "rank, id, url, title, description, image_url, first_claim_at, click_count, claimed_at, unfreeze_earliest, claimable";

function toEntry(row: BoardRow): BoardEntry {
  return {
    rank: Number(row.rank),
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url ?? undefined,
    firstClaimAt: row.first_claim_at,
    clickCount: row.click_count,
    claimedAt: row.claimed_at,
    unfreezeEarliest: row.unfreeze_earliest,
    claimable: row.claimable,
  };
}

export const BOARD_TAG = "board";
export const ARCHIVE_TAG = "archive";

/**
 * The board.
 *
 * Membership and order only change on a mutation, which `revalidateTag`
 * handles. `claimable` is different: it's derived from the clock, so nothing
 * invalidates it — which caps how long this can be cached. A minute is the
 * floor that survives prerendering (a "seconds" profile expires between the
 * warm and final passes and errors), and the cost is that a slot can read as
 * protected for up to a minute after it opens.
 *
 * That staleness is safe rather than merely tolerable: claim_slot re-checks the
 * real freeze inside the transaction, so acting on a stale board can never
 * produce a wrong claim — only a "still protected" message.
 */
export async function getBoard(): Promise<Board> {
  "use cache";
  cacheTag(BOARD_TAG);
  cacheLife("minutes");

  if (!isSupabaseConfigured()) {
    return { entries: [], liveCount: 0, tailSlot: 1, bestOpenSlot: 1 };
  }

  const { data, error } = await getSupabase()
    .from("board_live")
    .select(BOARD_COLUMNS)
    .order("rank", { ascending: true });

  if (error) throw new Error(`Failed to load board: ${error.message}`);

  const entries = (data ?? []).map((row) => toEntry(row as unknown as BoardRow));

  // Offer the best spot available rather than always the end of the queue:
  // if #5 is open, nobody wants #99. Falls back to the tail when the board is
  // fully protected, which is always joinable.
  const firstOpen = entries.find((entry) => entry.claimable);

  return {
    entries,
    liveCount: entries.length,
    tailSlot: entries.length + 1,
    bestOpenSlot: firstOpen ? firstOpen.rank : entries.length + 1,
  };
}

export async function getArchive(): Promise<Listing[]> {
  "use cache";
  cacheTag(ARCHIVE_TAG);
  // Nothing here is time-derived: entries only arrive via a claim or a removal,
  // and both invalidate this tag. Safe to hold for a long time.
  cacheLife("days");

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabase()
    .from("board_archived")
    .select("id, url, title, description, image_url, first_claim_at, click_count, claimed_at")
    .order("claimed_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`Failed to load archive: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    url: row.url as string,
    title: row.title as string,
    description: row.description as string,
    imageUrl: (row.image_url as string | null) ?? undefined,
    firstClaimAt: row.first_claim_at as string,
    clickCount: row.click_count as number,
    claimedAt: row.claimed_at as string,
    unfreezeEarliest: row.claimed_at as string,
  }));
}

export async function getListing(id: string): Promise<(Listing & { rank: number | null }) | null> {
  if (!isSupabaseConfigured()) return null;

  const live = await getSupabase()
    .from("board_live").select(BOARD_COLUMNS).eq("id", id).maybeSingle();

  if (live.data) return { ...toEntry(live.data as unknown as BoardRow) };

  const archived = await getSupabase()
    .from("board_archived")
    .select("id, url, title, description, image_url, first_claim_at, click_count, claimed_at")
    .eq("id", id).maybeSingle();

  if (!archived.data) return null;
  const row = archived.data;
  return {
    id: row.id as string,
    url: row.url as string,
    title: row.title as string,
    description: row.description as string,
    imageUrl: (row.image_url as string | null) ?? undefined,
    firstClaimAt: row.first_claim_at as string,
    clickCount: row.click_count as number,
    claimedAt: row.claimed_at as string,
    unfreezeEarliest: row.claimed_at as string,
    rank: null,
  };
}

export async function recordClick(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await getSupabase().rpc("increment_click", { p_listing_id: id });
  return !error;
}

/** Maps the typed exceptions raised by claim_slot onto messages users can act on. */
function mapClaimError(message: string): { code: ClaimErrorCode; error: string } {
  const code = message.split(":")[0]?.trim() as ClaimErrorCode;
  switch (code) {
    case "FROZEN_SLOT":
      return { code, error: "That spot is still protected. Try another, or come back when it opens." };
    case "FROZEN_SELF":
      return { code, error: "Your listing is still protected — you can't move it yet." };
    case "BOARD_MOVED":
      return { code, error: "The board moved while you were deciding. Take another look and claim again." };
    case "BAD_SLOT":
      return { code, error: "That spot doesn't exist on the board." };
    case "ALREADY_THERE":
      return { code, error: "You already hold that spot." };
    default:
      return { code: "UNKNOWN", error: "Something went wrong. Try again." };
  }
}

export async function submitClaim(input: ClaimInput): Promise<ClaimResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, code: "UNKNOWN", error: "The database isn't configured yet." };
  }

  const target = normalizeTarget(input.target);
  if (!target.ok) return { ok: false, code: "BAD_TARGET", error: target.error };

  const supabase = getSupabase();

  // Existing listing? Then this is a re-claim and needs ownership proof.
  const existing = await supabase
    .from("listing").select("id, owner_hash").eq("id", target.id).maybeSingle();

  let ownerHash: string;
  let recoveryCode: string | undefined;

  if (existing.data) {
    const stored = existing.data.owner_hash as string;
    if (!input.ownerToken || !ownerTokenMatches(input.ownerToken, stored)) {
      return {
        ok: false,
        code: "NOT_OWNER",
        error: "That listing is already claimed. Use your recovery code to move it.",
      };
    }
    ownerHash = stored;
  } else {
    // First claim: issue a token, store only its hash, show the raw value once.
    recoveryCode = generateOwnerToken();
    ownerHash = hashOwnerToken(recoveryCode);
  }

  // Metadata failure must never block a claim — fall back to the domain name.
  const metadata = await fetchListingMetadata(target.url);

  const { data, error } = await supabase.rpc("claim_slot", {
    p_listing_id: target.id,
    p_url: target.url,
    p_title: metadata.title,
    p_description: metadata.description,
    p_image_url: metadata.imageUrl ?? null,
    p_category_slug: null,
    p_owner_hash: ownerHash,
    p_slot: input.slot,
    p_expected_id: input.expectedListingId,
    p_freeze_seconds: FREEZE_SECONDS,
    p_ip_hash: input.ipHash ?? null,
  });

  if (error) return { ok: false, ...mapClaimError(error.message) };

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    listingId: row.out_listing_id as string,
    rank: row.out_rank === null ? null : Number(row.out_rank),
    unfreezeEarliest: row.out_unfreeze_earliest as string,
    recoveryCode,
  };
}

export async function searchListings(query: string): Promise<BoardEntry[]> {
  const q = query.trim();
  if (!q || !isSupabaseConfigured()) return [];

  const { data, error } = await getSupabase()
    .from("board_live")
    .select(BOARD_COLUMNS)
    .or(`title.ilike.%${q}%,id.ilike.%${q}%`)
    .limit(12);

  if (error) return [];
  return (data ?? []).map((row) => toEntry(row as unknown as BoardRow));
}

/**
 * Just the live count, for the header.
 *
 * Deliberately not derived from getBoard(): the header sits in the layout, so
 * it prerenders on every route, and pulling the whole board through a
 * seconds-long cache made the entry expire between prerendering's warm and
 * final passes — which surfaced as "unexpected cache miss" on every build.
 * A count is also a far cheaper query than 100 rows.
 */
export interface SiteStats {
  liveCount: number;
  archivedCount: number;
  openCount: number;
  totalClicks: number;
  bestClicks: number;
  totalClaims: number;
}

const EMPTY_STATS: SiteStats = {
  liveCount: 0, archivedCount: 0, openCount: 0,
  totalClicks: 0, bestClicks: 0, totalClaims: 0,
};

/**
 * Headline numbers, aggregated in Postgres rather than by pulling rows.
 *
 * Deliberately not derived from getBoard(): the header renders this on every
 * route, and dragging the whole board through it made the cache entry expire
 * between prerendering's warm and final passes.
 */
export async function getSiteStats(): Promise<SiteStats> {
  "use cache";
  cacheTag(BOARD_TAG);
  cacheLife("minutes");

  if (!isSupabaseConfigured()) return EMPTY_STATS;

  const { data, error } = await getSupabase()
    .from("board_stats")
    .select("live_count, archived_count, open_count, total_clicks, best_clicks, total_claims")
    .maybeSingle();

  if (error || !data) return EMPTY_STATS;

  return {
    liveCount: Number(data.live_count ?? 0),
    archivedCount: Number(data.archived_count ?? 0),
    openCount: Number(data.open_count ?? 0),
    totalClicks: Number(data.total_clicks ?? 0),
    bestClicks: Number(data.best_clicks ?? 0),
    totalClaims: Number(data.total_claims ?? 0),
  };
}
