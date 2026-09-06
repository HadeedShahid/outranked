/**
 * The brand half of a listing title, for poster-style billing.
 *
 * Listing titles usually read "Brand — what it does", and billing type wants
 * the name alone; the tagline runs underneath at a smaller size. Splits on the
 * common separators and falls back to the whole string when there isn't one.
 */
export function billingName(title: string): string {
  const [name] = title.split(/\s+[—–|:·]\s+/);
  return (name ?? title).trim() || title;
}

/** Whatever followed the separator, if anything. */
export function billingTagline(title: string): string | null {
  const match = title.split(/\s+[—–|:·]\s+/);
  return match.length > 1 ? match.slice(1).join(" — ").trim() : null;
}
