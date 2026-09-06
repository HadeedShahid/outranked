import { BOARD_CAP } from "@/lib/domain/rules";

export const metadata = { title: "Rules · outrank" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <span aria-hidden className="h-0.5 w-6 bg-[var(--brand)]" />
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
      </div>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function RulesPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <header>
        <span aria-hidden className="mb-3 block h-0.5 w-8 bg-[var(--brand)]" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Rules</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          One board, {BOARD_CAP} spots, free. Nothing is bought here — position
          is decided by who claimed a spot and whether they&apos;re still
          protected. There is no payment, no algorithm and no editor.
        </p>
      </header>

      <Section title="Taking a spot">
        <p>
          Every spot on the board can be contested. One is available when
          it&apos;s empty, or when the listing holding it is no longer protected.
        </p>
        <p>
          Taking a spot moves the listing there down one place, and everyone
          below shifts down with it. Being moved down is not being removed.
        </p>
        <p>
          The site always offers you the best spot going, not the back of the
          queue. If #4 is open, that&apos;s what you&apos;re offered.
        </p>
      </Section>

      <Section title="Protection">
        <p>
          A spot is protected for 24 hours from the moment it&apos;s claimed.
          Nobody can take it from you during that time.
        </p>
        <p>
          The countdown shows the earliest a spot can open. The actual moment is
          a few minutes later, chosen at random, so it can&apos;t be timed to the
          second by a script.
        </p>
        <p>
          You can&apos;t move your own listing while your protection is running.
          Once it lapses you&apos;re free to move — and so is everybody else.
        </p>
      </Section>

      <Section title="When the board is full">
        <p>
          The board holds {BOARD_CAP} listings. When a new one joins a full
          board, something has to drop — and it is the lowest-ranked listing
          whose protection has already lapsed, not simply whoever is last.
          Protection means the same thing wherever you are on the board.
        </p>
        <p>
          If every listing is protected, nothing can fairly be moved off. The new
          arrival waits in the archive instead, and can claim a spot as soon as
          one opens.
        </p>
      </Section>

      <Section title="The archive">
        <p>
          Nothing is deleted. Listings pushed off the board keep their page, keep
          their click count, and can claim a spot again at any time.
        </p>
      </Section>

      <Section title="Your listing">
        <p>
          There are no accounts. Your first claim gives you a recovery code —
          save it. It&apos;s how you move your listing from another browser, and
          it can&apos;t be shown to you twice.
        </p>
        <p>
          Listings are identified by domain. Submitting the same site again moves
          your existing listing rather than creating a second one, and tracking
          parameters are stripped from the link.
        </p>
      </Section>

      <Section title="What you can list">
        <p>A product website, or an X @handle.</p>
        <p>
          Not allowed: chat and invite links, sexual content, link shorteners,
          and affiliate or referral URLs.
        </p>
        <p>
          Listings that break these rules are removed, and the spot opens
          immediately for someone else.
        </p>
      </Section>
    </main>
  );
}
