"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { submitClaim } from "@/lib/api-client/listings";
import { HttpError } from "@/lib/network/http-client";
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

/**
 * Opens the claim form for one specific slot.
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [done, setDone] = useState<{ rank: number | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleToken = useCallback((value: string) => setToken(value), []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await submitClaim({
        target,
        slot,
        expectedListingId,
        turnstileToken: token,
      });
      setDone({ rank: result.rank });
      setRecoveryCode(result.recoveryCode ?? null);
      setTarget("");
      router.refresh();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setOpen(false);
    setDone(null);
    setRecoveryCode(null);
    setError(null);
    setCopied(false);
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

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : reset())}>
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

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" disabled={busy}>
                {busy ? "Claiming…" : `Take #${slot}`}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
