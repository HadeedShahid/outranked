import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>Rank is what you pay. Nothing else.</p>
        <nav className="flex items-center gap-4">
          <Link href="/rules" className="hover:text-foreground">
            Rules
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
