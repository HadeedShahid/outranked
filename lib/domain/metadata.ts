import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { displayHost } from "./url";

export interface ListingMetadata {
  title: string;
  description: string;
  imageUrl?: string;
}

const FETCH_TIMEOUT_MS = 4_000;
/** Only the document head is needed, so stop well before a full page download. */
const MAX_BYTES = 120_000;

/**
 * True when an IP address belongs to a range that must never be fetched.
 *
 * Checking the hostname text is not enough: a perfectly ordinary-looking
 * domain can have a DNS record pointing at 127.0.0.1 or an internal address,
 * which would turn this endpoint into a way to read things inside our own
 * network. So the address is resolved first and the *resolved* IPs are what
 * get judged.
 */
function isBlockedAddress(ip: string): boolean {
  const v = ip.toLowerCase();

  // IPv6, including IPv4 addresses written in IPv6 form.
  if (v === "::1" || v === "::") return true;
  if (v.startsWith("fe80:") || v.startsWith("fc") || v.startsWith("fd")) return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedAddress(mapped[1]);

  const parts = v.split(".");
  if (parts.length !== 4) return false;
  const [a, b] = parts.map(Number);
  if ([a, b].some((n) => !Number.isInteger(n))) return true;

  if (a === 0 || a === 127 || a === 10) return true;          // this host, loopback, private
  if (a === 169 && b === 254) return true;                     // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;            // private
  if (a === 192 && b === 168) return true;                     // private
  if (a === 100 && b >= 64 && b <= 127) return true;           // carrier-grade NAT
  return false;
}

/** Resolves a hostname and refuses it if any address it points to is internal. */
async function hostResolvesSafely(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (host === "metadata.google.internal") return false;

  // A bare IP needs no lookup — judge it directly.
  if (isIP(host)) return !isBlockedAddress(host);

  try {
    const addresses = await lookup(host, { all: true });
    if (addresses.length === 0) return false;
    return addresses.every((entry) => !isBlockedAddress(entry.address));
  } catch {
    return false;
  }
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return undefined;
}

/**
 * Pulls title, description and image from a listing's own page.
 *
 * Asking people to type a title, a description and an image URL on top of an
 * amount is three more chances to abandon the form — the page already declares
 * all of it in its metadata. Every failure path falls back to the domain name,
 * so a slow or hostile site can never block a claim from going through.
 */
/**
 * The largest icon a page declares.
 *
 * Sites routinely offer the same mark at many sizes — PostHog declares eight,
 * from 48px to 512px — and taking the first match lands on the smallest. The
 * top slot renders this at 88px, where a 16 or 48px source is visibly soft, so
 * the declared `sizes` decides. apple-touch-icon only breaks ties: those are
 * drawn as full-bleed app marks, where a plain favicon is often padded.
 *
 * `mask-icon` is excluded — Safari's monochrome silhouette, not a logo.
 */
function bestIconHref(html: string): string | undefined {
  let best: { href: string; score: number } | undefined;

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = /rel=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? "";
    if (!/(^|\s)(shortcut\s+)?icon(\s|$)/.test(rel) && !rel.includes("apple-touch-icon")) continue;
    if (rel.includes("mask-icon")) continue;

    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;

    const declared = /sizes=["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    const px = Number(/(\d+)x\d+/.exec(declared)?.[1] ?? 0);
    const score = px * 10 + (rel.includes("apple-touch-icon") ? 1 : 0);

    if (!best || score > best.score) best = { href, score };
  }

  return best?.href;
}

export async function fetchListingMetadata(url: string): Promise<ListingMetadata> {
  const fallback: ListingMetadata = { title: displayHost(url), description: "" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return fallback;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return fallback;
  if (!(await hostResolvesSafely(parsed.hostname))) return fallback;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // Manual redirects so every hop is re-validated — otherwise a public URL
    // can simply redirect to an internal one and bypass the check above.
    let target = parsed;
    let response: Response | null = null;

    for (let hop = 0; hop < 4; hop += 1) {
      response = await fetch(target.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: { accept: "text/html,application/xhtml+xml" },
      });

      if (response.status < 300 || response.status >= 400) break;

      const location = response.headers.get("location");
      if (!location) break;

      const next = new URL(location, target);
      if (next.protocol !== "https:" && next.protocol !== "http:") return fallback;
      if (!(await hostResolvesSafely(next.hostname))) return fallback;
      target = next;
      response = null;
    }

    if (!response || !response.ok || !response.body) return fallback;

    // Read only as far as the head, rather than buffering whole pages.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let bytes = 0;
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    reader.cancel().catch(() => {});

    const title =
      metaContent(html, [
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ]) ?? fallback.title;

    const description =
      metaContent(html, [
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
      ]) ?? "";

    // This image is only ever shown as a square 36-88px mark, so a square icon
    // beats og:image every time: a social card is 1200x630, and cropping one to
    // a square yields a meaningless slice of a screenshot rather than a logo.
    // og:image stays as the last resort, and /favicon.ico as the one after that
    // — plenty of sites serve it without ever declaring a <link>.
    const rawImage =
      bestIconHref(html) ??
      metaContent(html, [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      ]) ??
      "/favicon.ico";

    // The stored URL is loaded by every visitor's browser, so it gets the same
    // host check as our own fetch. Without this a page declaring
    // <meta og:image="http://localhost:3000/logo.png"> — the default when a
    // Next.js app ships without metadataBase, and already present in our data —
    // points every visitor's browser at their own machine.
    let imageUrl: string | undefined;
    try {
      const resolved = new URL(rawImage, target);
      if (
        (resolved.protocol === "https:" || resolved.protocol === "http:") &&
        (await hostResolvesSafely(resolved.hostname))
      ) {
        imageUrl = resolved.toString();
      }
    } catch {
      imageUrl = undefined;
    }

    return {
      title: title.slice(0, 120),
      description: description.slice(0, 200),
      imageUrl,
    };
  } catch {
    // Timeouts, DNS failures, non-HTML responses — the claim still proceeds.
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
