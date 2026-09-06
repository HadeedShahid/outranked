import { AdSlot } from "./ad-slot";

/**
 * Vertical sponsor slot flanking the board.
 *
 * Only rendered from `xl` up — below that the viewport has no spare width, and
 * squeezing a rail in would cost the board more than the slot is worth. Sticky
 * so it stays visible down a hundred rows.
 */
export function SideRail() {
  return (
    <aside className="hidden w-[200px] shrink-0 xl:block">
      <div className="sticky top-20">
        <AdSlot variant="rail" />
      </div>
    </aside>
  );
}
