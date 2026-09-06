/** Where sponsorship and advertising enquiries go. */
export const CONTACT_EMAIL = "hadeed.shahid08@gmail.com";

export const SITE_NAME = "outrank";

/**
 * Absolute origin, used for canonical URLs, sitemap entries and OG image URLs.
 *
 * This MUST be set in production. Left unset, every canonical and og:image the
 * site emits points at localhost — which is not hypothetical: a listing already
 * on this board ships `og:image="http://localhost:3000/logo.png"` for exactly
 * this reason, because its own framework had no base URL configured.
 *
 * VERCEL_PROJECT_PRODUCTION_URL is the stable production domain, not the
 * per-deployment URL, so preview builds still canonicalise to production
 * rather than competing with it in the index.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/** One sentence, reused as the meta description and the OG description. */
export const SITE_DESCRIPTION =
  "A public leaderboard of 100 spots. Claiming one is free — you hold it for 24 hours, then anyone can take it. No payment, no algorithm, no editor.";

/** Short line for the footer and OG image. */
export const SITE_TAGLINE = "Free to claim. Yours for 24 hours. Then it's anyone's.";

/**
 * Edit this to introduce yourself — it's the only place the about page reads
 * personal details from.
 */
export const FOUNDER = {
  name: "Hadeed",
  role: "Indie developer",
  handle: "",
  blurb:
    "I build small products on my own, and I kept running into the same thing: every directory worth being listed in either wants money for position or hides how position is decided. So I made one where neither is true. Rank here is free, the rules are on one page, and losing your spot happens in public.",
} as const;
