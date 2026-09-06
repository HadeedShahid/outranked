"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, navLinkClass } from "./nav-items";

/**
 * Marks the current route.
 *
 * usePathname is URL data, so under Cache Components this cannot be part of a
 * prerendered shell — the header renders it inside <Suspense> with a plain copy
 * of the same links as the fallback. Reading the pathname without that boundary
 * fails the build on every dynamic route.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={navLinkClass(active)}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
