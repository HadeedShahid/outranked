import { CONTACT_EMAIL } from "@/lib/domain/site";

/**
 * A sellable slot.
 *
 * Renders a Google AdSense unit when a publisher ID is configured, and
 * otherwise an honest "this space is for sale" placeholder — which is useful
 * on day one, when the inventory has no buyers and no ad account yet.
 *
 * The dashed rule is brand-coloured outright rather than on hover — a grey
 * dashed box reads as a rendering gap. The rule carries it alone: the copy
 * stays in body colours so the slot marks itself out without competing with
 * the board for attention.
 */
/**
 * Box and quoted asset size per slot, kept in one place so the number a buyer
 * reads cannot drift from the CSS that draws the box. Heights are fixed; the
 * banner and in-feed widths are fluid, so those quote the widest they ever
 * render (measured at the 1600px layout cap and the 896px board column).
 */
const PLACEHOLDER = {
  banner: {
    shape: "h-[100px] w-full flex-col gap-0.5 px-4 md:h-[120px] sm:flex-row sm:gap-2",
    size: "1552 \u00d7 120",
  },
  rail: {
    shape: "h-[600px] w-full flex-col gap-1 px-3",
    size: "200 \u00d7 600",
  },
  inline: {
    shape: "h-[100px] w-full flex-col gap-0.5 px-4 sm:h-[90px] sm:flex-row sm:gap-2",
    size: "896 \u00d7 90",
  },
} as const;

export function AdSlot({
  variant,
  className = "",
}: {
  variant: "banner" | "rail" | "inline";
  className?: string;
}) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot =
    variant === "banner"
      ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER
      : variant === "inline"
        ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE
        : process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL;

  if (client && slot) {
    return (
      <ins
        className={`adsbygoogle block h-full w-full ${className}`}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={variant === "rail" ? "vertical" : variant === "inline" ? "fluid" : "horizontal"}
        data-full-width-responsive="true"
      />
    );
  }

  const { shape, size } = PLACEHOLDER[variant];

  return (
    <a
      href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        variant === "rail" ? "Sponsor slot on outrank" : "Featured banner on outrank"
      )}`}
      className={`flex items-center justify-center border border-dashed border-[var(--brand)] text-center ${shape} ${className}`}
    >
      <span className="text-xs font-semibold">Feature your business here</span>
      <span className="text-xs text-muted-foreground">
        {variant === "rail" ? "Get in touch" : CONTACT_EMAIL}
      </span>
      <span className="font-mono text-[11px] text-muted-foreground">{size}</span>
    </a>
  );
}
