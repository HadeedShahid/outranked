"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ClaimDialog, type ClaimRequest } from "./claim-dialog";

const ClaimDialogContext = createContext<((request: ClaimRequest) => void) | null>(null);

/**
 * Owns the one claim dialog on the page.
 *
 * Mounted from the root layout on purpose. A layout is not re-rendered when
 * page data changes, so the dialog — and the one-time recovery code inside it —
 * survives the board reordering underneath it. Anything mounted from the board
 * itself does not: claiming a slot protects it, which removes the very button
 * that opened the dialog.
 */
export function ClaimDialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ClaimRequest | null>(null);

  const open = useCallback((next: ClaimRequest) => setRequest(next), []);
  const close = useCallback(() => setRequest(null), []);

  // Stable identity: the provider sits above every page, so a changing value
  // would re-render the whole tree on each claim.
  const value = useMemo(() => open, [open]);

  return (
    <ClaimDialogContext.Provider value={value}>
      {children}
      <ClaimDialog request={request} onClose={close} />
    </ClaimDialogContext.Provider>
  );
}

export function useClaimDialog() {
  const open = useContext(ClaimDialogContext);
  if (!open) {
    throw new Error("useClaimDialog must be used inside <ClaimDialogProvider>");
  }
  return open;
}
