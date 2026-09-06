/** Board mechanics, in one place so the UI and the engine can never disagree. */

/** How long a slot is protected after it's claimed. */
export const FREEZE_SECONDS = 24 * 60 * 60;

/** Live slots. Anything pushed past this is archived, never deleted. */
export const BOARD_CAP = 100;

/** Hosts where the path identifies the product, so two apps on one platform
 *  don't collapse into a single listing. */
export const PATH_KEYED_HOSTS = new Set([
  "github.com", "apps.apple.com", "play.google.com",
  "testflight.apple.com", "chromewebstore.google.com",
  "marketplace.visualstudio.com",
]);

/** Chat and invite links — the board is for products and profiles. */
export const BLOCKED_HOSTS = new Set([
  "t.me", "telegram.me", "wa.me", "chat.whatsapp.com",
  "discord.gg", "discord.com", "m.me", "signal.me",
]);

export const SHORTENER_HOSTS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl",
  "ow.ly", "buff.ly", "rebrand.ly", "short.io",
]);
