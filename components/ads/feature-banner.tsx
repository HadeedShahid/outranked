import { AdSlot } from "./ad-slot";

/**
 * The strip directly under the nav. Doubles as breathing room — the board used
 * to start hard against the header — and as the first thing a potential
 * sponsor sees.
 *
 * Shares max-width and horizontal padding with the row below it, so its bottom
 * corners land exactly on the rails' top outer corners at every viewport.
 */
export function FeatureBanner() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-3 pt-4 sm:px-6">
      <AdSlot variant="banner" className="w-full" />
    </div>
  );
}
