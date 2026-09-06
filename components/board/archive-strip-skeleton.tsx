import { Skeleton } from "@/components/ui/skeleton";

/** Reserves the strip's space while it streams, so the page doesn't jump. */
export function ArchiveStripSkeleton() {
  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-3 border-t border-border pt-6">
      <Skeleton className="h-2 w-32" />
      <div className="flex flex-wrap justify-center gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-24" />
        ))}
      </div>
    </div>
  );
}
