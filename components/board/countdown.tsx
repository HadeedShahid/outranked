"use client";

import { useEffect, useState } from "react";

/**
 * Time until a slot's published opening time.
 *
 * This is the *earliest* it can open — the real moment is a hidden few minutes
 * later, so a script can't wait for an exact second. When the countdown hits
 * zero the slot is "opening soon", not open.
 */
export function Countdown({ target }: { target: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(new Date(target).getTime() - Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);

  // Server and first client render must agree, so render nothing until mounted.
  if (remaining === null) return <span className="tabular-nums">—</span>;
  if (remaining <= 0) return <span className="text-[var(--brand-text)]">opening soon</span>;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  // Colour is rationed to the last hour. Painting every frozen slot red would
  // make the whole board urgent, which is the same as none of it being urgent.
  const closing = hours < 1;

  return (
    <span className={`tabular-nums${closing ? " text-[var(--brand-text)]" : ""}`}>
      {hours > 0 ? `${hours}h ` : ""}{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
