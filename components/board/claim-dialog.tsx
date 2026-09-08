"use client";

import { useCallback, useState, type FormEvent } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { claimSlot } from "@/lib/actions/claim";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TurnstileWidget } from "./turnstile-widget";

export interface ClaimRequest {
  slot: number;
  /** Listing the page believed held this slot. Null when appending. */
  expectedListingId: string | null;
}

/**
 * The claim form and its result.
 *
 * Mounted once, from the layout — never from a row. The recovery code is shown
 * exactly once and cannot be reissued, so the component holding it must not be
 * something a board update can unmount. It previously lived inside the trigger
 * button, which every listing renders only while its slot is claimable: taking
 * a slot protects it, `claimable` flipped to false, the button was swapped for
 * a countdown, and React destroyed the dialog with the code still in it.
 */
export function ClaimDialog({
  request,
  onClose,
}: {
  request: ClaimRequest | null;
  onClose: () => void;
}) {
  const [target, setTarget] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [done, setDone] = useState<{ rank: number | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleToken = useCallback((value: string) => setToken(value), []);

  function reset() {
    setTarget("");
    setToken("");
    setError(null);
    setRecoveryCode(null);
    setDone(null);
    setCopied(false);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!request) return;

    setBusy(true);
    setError(null);

    try {
      // The action reports failures as values — a protected slot or a moved
      // board is an answer, not an exception. Only a genuine transport or
      // server fault lands in catch.
      const result = await claimSlot({
        target,
        slot: request.slot,
        expectedListingId: request.expectedListingId,
        turnstileToken: token,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setDone({ rank: result.rank });
      setRecoveryCode(result.recoveryCode ?? null);
      setTarget("");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!recoveryCode) return;
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure origin, denied permission). The code
      // stays selectable on screen, so this is a convenience, not the only path.
      setCopied(false);
    }
  }

  const slot = request?.slot ?? 0;

  return (
    <Dialog open={request !== null} onOpenChange={(next) => (next ? undefined : reset())}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {done.rank === null ? "You're in the archive" : `You're at #${done.rank}`}
              </DialogTitle>
              <DialogDescription>
                {done.rank === null
                  ? "The board is full and every spot on it is still protected, so nobody could be moved off. Your listing is saved — claim a spot as soon as one opens."
                  : "Your spot is protected for 24 hours. After that anyone can take it."}
              </DialogDescription>
            </DialogHeader>

            {recoveryCode && (
              <div className="flex flex-col gap-2 border border-[var(--brand)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wider">
                  Save this recovery code
                </p>

                <div className="flex items-center gap-3">
                  <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed">
                    {recoveryCode}
                  </code>
                  <button
                    type="button"
                    onClick={copyCode}
                    aria-label={copied ? "Copied" : "Copy recovery code"}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {copied ? "Copied. " : ""}
                  It&apos;s the only way to move your listing from another browser.
                  We can&apos;t show it again.
                </p>
              </div>
            )}

            <Button onClick={reset}>Done</Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Take spot #{slot}</DialogTitle>
              <DialogDescription>
                Free. Your spot is protected for 24 hours once you take it.
              </DialogDescription>
            </DialogHeader>

            <Input
              autoFocus
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Your product URL or @handle"
              aria-label="Product URL or handle"
              className="h-10"
            />

            <TurnstileWidget onToken={handleToken} />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={busy}>
              {busy ? "Claiming…" : `Take #${slot}`}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
