"use client";

import { Button } from "@/components/ui/button";
import { useClaimDialog } from "./claim-dialog-provider";

/**
 * Opens the claim form for one specific slot.
 *
 * A trigger only. The dialog itself lives in the layout, because this button is
 * rendered conditionally — a listing shows it while its slot is claimable — and
 * claiming that slot makes it un-claimable, which unmounts the button. Owning
 * the dialog here meant a successful claim destroyed its own result.
 *
 * `expectedListingId` is the listing the page believed held this slot. Ranks
 * are derived, so the board can move between render and submit — the server
 * rejects the claim rather than silently putting you somewhere you didn't pick.
 */
export function ClaimButton({
  slot,
  expectedListingId,
  label,
  variant = "outline",
  size = "sm",
  className,
}: {
  slot: number;
  expectedListingId: string | null;
  label: string;
  variant?: "default" | "outline" | "ghost" | "accent";
  size?: "xs" | "sm" | "default" | "lg";
  className?: string;
}) {
  const openClaim = useClaimDialog();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => openClaim({ slot, expectedListingId })}
    >
      {label}
    </Button>
  );
}
