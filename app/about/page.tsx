import { Suspense } from "react";
import { getSiteStats } from "@/lib/data/listings";
import { BOARD_CAP } from "@/lib/domain/rules";
import { CONTACT_EMAIL, FOUNDER } from "@/lib/domain/site";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "About · outrank" };

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card className="gap-0 border border-border p-4 text-center ring-0">
      <p className="truncate text-lg font-bold tabular-nums sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{label}</p>
    </Card>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-12">
      <header>
        <span aria-hidden className="mb-3 block h-0.5 w-8 bg-[var(--brand)]" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">About</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Most directories decide your position for you — an algorithm, an
          editor, a sales call. This one doesn&apos;t. There are {BOARD_CAP} spots,
          they cost nothing, and the only thing between you and the top is
          whether the business already there is still protected.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Take a spot and it&apos;s yours for 24 hours. After that anyone can take
          it. Losing it in public is the point — it&apos;s what makes holding it
          worth something.
        </p>
      </header>

      <Suspense fallback={<StatsSkeleton />}>
        <BoardStats />
      </Suspense>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span aria-hidden className="h-0.5 w-6 bg-[var(--brand)]" />
          <h2 className="text-lg font-semibold tracking-tight">Who made this</h2>
        </div>
        <Card className="gap-3 border border-border p-5 ring-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{FOUNDER.name}</span>
            <span className="text-xs text-muted-foreground">{FOUNDER.role}</span>
            {FOUNDER.handle && (
              <span className="text-xs text-[var(--brand-text)]">{FOUNDER.handle}</span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{FOUNDER.blurb}</p>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span aria-hidden className="h-0.5 w-6 bg-[var(--brand)]" />
          <h2 className="text-lg font-semibold tracking-tight">Advertise here</h2>
        </div>
        <Card className="gap-3 border border-border p-5 ring-0">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The banner above the board and the columns either side of it are for
            sale. One featured business at a time, no auction and no bidding —
            a flat rate, arranged directly.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Advertising on outrank")}`}
            className="text-sm font-medium text-[var(--brand-text)] underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
        </Card>
      </section>
    </main>
  );
}

async function BoardStats() {
  const stats = await getSiteStats();

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat value={String(stats.liveCount)} label="on the board" />
      <Stat value={String(stats.openCount)} label="spots open right now" />
      <Stat value={String(BOARD_CAP - stats.liveCount)} label="never claimed" />
      <Stat value={stats.totalClicks.toLocaleString()} label="clicks sent to listings" />
      <Stat value={stats.totalClaims.toLocaleString()} label="spots claimed all time" />
      <Stat value={String(stats.archivedCount)} label="pushed into the archive" />
    </section>
  );
}

function StatsSkeleton() {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[84px] w-full" />
      ))}
    </section>
  );
}
