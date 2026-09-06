import { Suspense } from "react";
import Link from "next/link";
import { getSiteStats } from "@/lib/data/listings";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NAV, navLinkClass } from "./nav-items";
import { SiteNav } from "./site-nav";
import { SearchDialog } from "./search-dialog";

/**
 * The header shell is synchronous so every route — including 404 — can be
 * prerendered. Its one piece of data streams in behind a Suspense boundary;
 * without that, a database read in the layout blocks the static shell of the
 * entire app.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="text-sm font-bold tracking-tight">
            outrank<span className="text-[var(--brand-text)]">.</span>
          </Link>
          <Suspense fallback={null}>
            <BoardCount />
          </Suspense>
        </div>

        <nav className="flex items-center gap-1">
          {/* The active marker needs the pathname, which is URL data and so
              cannot appear in a prerendered shell. The fallback is the same
              links without the marker, so nothing moves when it swaps. */}
          <Suspense fallback={<PlainNav />}>
            <SiteNav />
          </Suspense>
          <SearchDialog />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

async function BoardCount() {
  const stats = await getSiteStats();

  return (
    <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
      <span className="size-1.5 bg-[var(--brand)]" />
      {stats.liveCount} on the board
    </span>
  );
}

function PlainNav() {
  return (
    <>
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} className={navLinkClass(false)}>
          {item.label}
        </Link>
      ))}
    </>
  );
}
