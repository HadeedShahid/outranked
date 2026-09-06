import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Per-listing ownership without accounts.
 *
 * Only the hash of a token is ever stored, so a database leak can't be used to
 * take listings over. The raw token goes to the owner once, as a cookie plus a
 * recovery code.
 */

export function generateOwnerToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOwnerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time compare, so timing can't be used to guess a token. */
export function ownerTokenMatches(token: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashOwnerToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

/** Claim ownership cookie name. */
export const OWNER_COOKIE = "outrank_owner";

/** Hash an IP for abuse forensics — we never store the address itself. */
export function hashIp(ip: string | null): string | undefined {
  if (!ip) return undefined;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
