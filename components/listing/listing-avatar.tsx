import { cn } from "cn";
import type { Listing } from "@/lib/types/board";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-2xl",
} as const;

const PX = { sm: 36, md: 48, lg: 80 } as const;

/**
 * Listing avatar.
 *
 * Deliberately a plain <img> rather than next/image. Image sources here come
 * from whatever domain a user submits, so next/image would need its hostname
 * allowlist wildcarded — which turns the optimizer into an open proxy anyone
 * can drive at our expense. At 36–80px there is nothing worth optimizing.
 *
 * width/height are set to reserve space and avoid layout shift, and the
 * referrer is withheld so third-party hosts don't learn which of our pages
 * a visitor is on.
 */
export function ListingAvatar({
  listing,
  size = "sm",
  eager = false,
  className,
}: {
  listing: Listing;
  size?: keyof typeof SIZES;
  /** Set for marks above the fold; lazy-loading those only delays them. */
  eager?: boolean;
  /** Overrides the preset box; `size` still supplies the intrinsic dimensions. */
  className?: string;
}) {
  const px = PX[size];

  if (listing.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- see note above
      <img
        src={listing.imageUrl}
        alt=""
        width={px}
        height={px}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn(SIZES[size], "shrink-0 rounded-[4px] border border-border bg-border object-cover", className)}
      />
    );
  }

  return (
    <div className={cn(
        SIZES[size],
        "flex shrink-0 items-center justify-center rounded-[4px] border border-border bg-border font-bold",
        className,
      )}>
      {listing.title.charAt(0).toUpperCase()}
    </div>
  );
}
