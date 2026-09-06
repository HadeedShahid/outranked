"use server";

import { updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { ARCHIVE_TAG, BOARD_TAG, submitClaim } from "@/lib/data/listings";
import { hashIp, OWNER_COOKIE } from "@/lib/domain/ownership";
import { verifyTurnstile } from "@/lib/domain/turnstile";
import type { ClaimResult } from "@/lib/types/board";

export interface ClaimActionInput {
  target: string;
  slot: number;
  /** Listing the page believed held this slot; null when appending. */
  expectedListingId: string | null;
  turnstileToken: string;
}

/**
 * Claim a slot.
 *
 * A Server Action rather than a Route Handler for two reasons that matter here.
 *
 * The first is `updateTag`, which is Server-Action-only and expires the board
 * cache outright. `revalidateTag` — the only option from a Route Handler —
 * keeps serving the pre-claim board while it refreshes behind the scenes, so
 * the person who just claimed a spot could not see it without reloading.
 *
 * The second is that the action's response carries the re-rendered tree, so the
 * board updates in the same round-trip. The old flow was POST, then a separate
 * router.refresh() that raced the revalidation and usually lost.
 *
 * Errors come back as values, not exceptions: every failure here is something
 * the person can act on ("that spot is protected", "the board moved"), and the
 * dialog needs the code to say which.
 */
export async function claimSlot(input: ClaimActionInput): Promise<ClaimResult> {
  if (!input.target || typeof input.slot !== "number") {
    return { ok: false, code: "BAD_TARGET", error: "Missing required fields." };
  }

  // No manual origin check: Next verifies Origin against Host for every Server
  // Action, which is what the Route Handler was doing by hand.
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip");

  if (!(await verifyTurnstile(input.turnstileToken, ip ?? undefined))) {
    return {
      ok: false,
      code: "BAD_CAPTCHA",
      error: "Verification failed. Reload and try again.",
    };
  }

  const jar = await cookies();

  const result = await submitClaim({
    target: input.target,
    slot: input.slot,
    expectedListingId: input.expectedListingId,
    turnstileToken: input.turnstileToken,
    ownerToken: jar.get(OWNER_COOKIE)?.value,
    ipHash: hashIp(ip),
  });

  if (!result.ok) return result;

  // A first claim issues the token. httpOnly so script on the page can't read
  // it; SameSite=Lax so it doesn't ride along on cross-site requests.
  if (result.recoveryCode) {
    jar.set(OWNER_COOKIE, result.recoveryCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  // A claim reorders the board and may push a listing into the archive.
  updateTag(BOARD_TAG);
  updateTag(ARCHIVE_TAG);

  return result;
}
