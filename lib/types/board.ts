export type ListingStatus = "live" | "archived" | "removed";

export interface Listing {
  id: string;
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  firstClaimAt: string;
  clickCount: number;
  claimedAt: string;
  /** The time we publish. The real expiry is a hidden few minutes later, so a
   *  script can't wait for an exact second. Never expose the true value. */
  unfreezeEarliest: string;
}

export interface BoardEntry extends Listing {
  rank: number;
  /** Whether this slot can be taken right now. */
  claimable: boolean;
}

export interface Board {
  entries: BoardEntry[];
  liveCount: number;
  /** Slot a newcomer appends into. Always joinable, so the board never turns
   *  anyone away even when every existing slot is protected. */
  tailSlot: number;
  /** Lowest-numbered open slot — what the join CTA should offer. Falls back to
   *  the tail when nothing on the board is open. */
  bestOpenSlot: number;
}

export interface ClaimInput {
  target: string;
  slot: number;
  /** Listing the caller believes holds `slot`. Null when appending. Ranks are
   *  derived, so the board may have moved between page load and submit. */
  expectedListingId: string | null;
  turnstileToken: string;
  ownerToken?: string;
  ipHash?: string;
}

export type ClaimErrorCode =
  | "FROZEN_SLOT" | "FROZEN_SELF" | "BOARD_MOVED" | "BAD_SLOT"
  | "ALREADY_THERE" | "NOT_OWNER" | "BAD_TARGET" | "BAD_CAPTCHA" | "UNKNOWN";

export type ClaimResult =
  | {
      ok: true;
      listingId: string;
      /** Null when the board was full and everything on it was protected —
       *  the arrival waits in the archive instead of evicting someone. */
      rank: number | null;
      unfreezeEarliest: string;
      /** Shown once, only on a first claim. */
      recoveryCode?: string;
    }
  | { ok: false; code: ClaimErrorCode; error: string };
