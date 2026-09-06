import "server-only";
import { Resend } from "resend";

/**
 * Resend client, lazily initialised for the same build-time reason as the
 * Supabase client: constructing it at module scope would throw during
 * `next build` before the key exists.
 */
let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set — see .env.example.");
  }

  cached = new Resend(apiKey);
  return cached;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
