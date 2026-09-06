"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

/**
 * The <img> half of a listing mark, with a letter fallback when it fails.
 *
 * Stored icon URLs rot: a site redesigns, a CDN path changes, and months later
 * the mark is an empty box. Without this the failure is silent and permanent —
 * the server has no way to know, and re-checking every URL on render is not
 * affordable.
 *
 * The ref callback matters as much as onError: an image that fails before
 * hydration has already fired its error event, so onError alone never runs.
 * Checking `complete && naturalWidth === 0` on mount catches that case.
 */
export function ListingMark({
  src,
  px,
  eager,
  letter,
  className,
  style,
}: {
  src: string;
  px: number;
  eager: boolean;
  letter: string;
  className: string;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center font-bold`} style={style}>
        {letter}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- see listing-avatar
    <img
      ref={(el) => {
        if (el?.complete && el.naturalWidth === 0) setFailed(true);
      }}
      src={src}
      alt=""
      width={px}
      height={px}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
      style={style}
    />
  );
}
