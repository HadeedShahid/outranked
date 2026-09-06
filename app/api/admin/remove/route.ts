import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ARCHIVE_TAG, BOARD_TAG } from "@/lib/data/listings";

/**
 * Admin removal. The one operational control that can't wait: without it a
 * scam or adult listing sits on the front page for a full protection window
 * with no way to take it down.
 *
 * Removing clears the listing's sort key, which both hides it and frees its
 * position — the board renumbers itself because ranks are derived.
 */
function secretMatches(provided: string | null): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const headerList = await headers();

  if (!secretMatches(headerList.get("x-admin-secret"))) {
    // Uniform response — never reveal whether the secret is merely unset.
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const body = (await request.json()) as { listingId?: string };
  if (!body.listingId) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }

  const { data, error } = await getSupabase().rpc("remove_listing", {
    p_listing_id: body.listingId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // See the note in /api/claim: a named profile keeps serving the pre-removal
  // board to the very caller that just changed it.
  revalidateTag(BOARD_TAG, { expire: 0 });
  revalidateTag(ARCHIVE_TAG, { expire: 0 });

  return NextResponse.json({ ok: true, removed: data === true });
}
