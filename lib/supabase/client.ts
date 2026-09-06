import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 *
 * The browser never talks to Supabase directly — every read and write goes
 * through Next.js. That keeps the service-role key server-side, lets us cache
 * aggressively in front of the database (which matters on the free tier), and
 * means RLS can stay deny-all rather than encoding auth rules in policies.
 *
 * Initialisation is lazy on purpose. Next.js evaluates top-level module code
 * during `next build`, so creating the client at module scope would crash the
 * build on any machine where the env vars aren't set yet.
 *
 * Note: a plain function, not a Proxy wrapper. Proxies around DB clients break
 * libraries that introspect the object, and fail in ways that are hard to trace.
 */
let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local — see .env.example."
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}

/** True when the database is wired up. Lets the app fall back to mock data. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
