import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const NAV = [
  { href: "/archive", label: "Archive" },
  { href: "/rules", label: "Rules" },
  { href: "/about", label: "About" },
];

/**
 * Shared so the prerendered fallback and the pathname-aware version are the
 * same links in the same boxes — only the active colour differs, which is why
 * swapping one for the other causes no shift.
 */
export function navLinkClass(active: boolean) {
  return cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    "px-3",
    active && "text-[var(--brand-text)] hover:text-[var(--brand-text)]",
  );
}
