import { Fragment } from "react";
import type { BoardEntry } from "@/lib/types/board";
import { AdSlot } from "@/components/ads/ad-slot";
import { RankRow } from "./rank-row";

/** Where in-feed slots sit, counted in rows. */
const INLINE_AD_AFTER = [8, 28];

/**
 * The chasing pack, with in-feed sponsor slots woven in.
 *
 * The rails either side of the board only exist from `xl` up, so on phones the
 * inventory would otherwise drop from three slots to one — on what will be most
 * of the traffic. These sit in the reading path instead, and are hidden at `xl`
 * where the rails take over, so no viewport ever shows both.
 *
 * A Fragment, not a wrapper element: RankRow already returns an <li>, so
 * wrapping it would nest <li> inside <li> and browsers would quietly restructure
 * the list around it.
 */
export function BoardRows({ rows }: { rows: BoardEntry[] }) {
  if (rows.length === 0) return null;

  return (
    <ul className="flex w-full max-w-4xl flex-col gap-2">
      {rows.map((entry, i) => (
        <Fragment key={entry.id}>
          <RankRow entry={entry} />
          {INLINE_AD_AFTER.includes(i) && i < rows.length - 1 && (
            <li className="xl:hidden">
              <AdSlot variant="inline" className="w-full" />
            </li>
          )}
        </Fragment>
      ))}
    </ul>
  );
}
