"use client";

import { useSyncExternalStore } from "react";
import { formatRelativeTime } from "@/lib/utils/relative-time";

/** Re-renders subscribers once a minute — enough resolution for "3 days ago". */
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

/** Changes only when the minute does, so React doesn't loop on a new value. */
const getSnapshot = () => Math.floor(Date.now() / 60_000);
const getServerSnapshot = () => null;

/**
 * A relative timestamp, computed on the client.
 *
 * `Date.now()` can't run during a prerender — the value changes between
 * renders, so Cache Components rejects it. Caching it would be worse: "3 days
 * ago" would freeze at whatever it was when the cache filled.
 *
 * The server snapshot is null, so both the server and the first client render
 * emit the calendar date — derived purely from the ISO string, and therefore
 * identical on both sides. useSyncExternalStore rather than an effect, since
 * setting state from an effect is what triggers the render cascade the lint
 * rule is guarding against.
 */
export function RelativeTime({ iso }: { iso: string }) {
  const minute = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <time dateTime={iso}>{minute === null ? iso.slice(0, 10) : formatRelativeTime(iso)}</time>
  );
}
