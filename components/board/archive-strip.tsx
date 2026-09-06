import Link from "next/link";
import { getArchive } from "@/lib/data/listings";

/**
 * Archived listings as bare name chips.
 *
 * Deliberately minimal — no avatars, no descriptions. These are listings that
 * fell off the board, so they should read as a footnote, not compete with it.
 * Rendered inside Suspense so its query never blocks the board from painting.
 */
export async function ArchiveStrip() {
  const listings = await getArchive();
  if (listings.length === 0) return null;

  return (
    <section className="flex w-full max-w-4xl flex-col items-center gap-3 border-t border-border pt-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
        Fell off the board
      </p>

      <ul className="flex flex-wrap justify-center gap-1.5">
        {listings.slice(0, 40).map((listing) => (
          <li key={listing.id}>
            <Link
              href={`/product/${listing.id}`}
              className="block border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--brand)] hover:text-foreground"
            >
              {listing.title}
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/archive" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
        See the full archive
      </Link>
    </section>
  );
}
