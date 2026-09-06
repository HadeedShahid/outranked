import { BLOCKED_HOSTS, PATH_KEYED_HOSTS, SHORTENER_HOSTS } from "./rules";

export type NormalizeResult =
  | { ok: true; id: string; url: string; label: string }
  | { ok: false; error: string };

/**
 * Turns raw user input into a canonical listing identity.
 *
 * Two submissions of the same product must collapse onto one listing,
 * otherwise a rival could take "your" rank by submitting the same site with a
 * tracking parameter attached. So query strings and fragments are dropped, the
 * host is lowercased and de-`www`'d, and the path is ignored — except on
 * platform hosts, where the path *is* the product and two apps must not share
 * a rank.
 */
export function normalizeTarget(raw: string): NormalizeResult {
  const input = raw.trim();
  if (!input) return { ok: false, error: "Enter a product URL or @handle." };

  // An @handle is shorthand for an X profile.
  if (input.startsWith("@")) {
    const handle = input.slice(1).replace(/[^A-Za-z0-9_]/g, "");
    if (!handle) return { ok: false, error: "That handle doesn't look right." };
    return {
      ok: true,
      id: `x.com/${handle.toLowerCase()}`,
      url: `https://x.com/${handle}`,
      label: `@${handle}`,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

  if (!host.includes(".")) return { ok: false, error: "That doesn't look like a valid URL." };
  if (BLOCKED_HOSTS.has(host)) {
    return { ok: false, error: "Chat and invite links aren't allowed — list a product or profile." };
  }
  if (SHORTENER_HOSTS.has(host)) {
    return { ok: false, error: "Shortened links aren't allowed. Submit the destination URL." };
  }

  // Path only participates in identity on platform hosts.
  const path = PATH_KEYED_HOSTS.has(host) ? parsed.pathname.replace(/\/+$/, "").toLowerCase() : "";

  return {
    ok: true,
    id: path ? `${host}${path}` : host,
    url: `https://${host}${path}`,
    label: path ? `${host}${path}` : host,
  };
}

/** Human-facing domain for a listing, e.g. "pecan.ai". */
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
