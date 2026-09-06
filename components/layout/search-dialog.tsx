"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchListings, type SearchHit } from "@/lib/api-client/listings";

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);

  useEffect(() => {
    if (!query.trim()) return;
    // Debounced so typing doesn't fire a request per keystroke.
    const timer = setTimeout(() => {
      searchListings(query)
        .then(setHits)
        .catch(() => setHits([]));
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Derived rather than cleared in an effect: an empty box shows no results
  // regardless of what the last request returned.
  const visibleHits = query.trim() ? hits : [];

  function go(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/product/${id}`);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Search listings"
      >
        <SearchIcon />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search listings</DialogTitle>
          </DialogHeader>

          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or domain"
            aria-label="Search query"
            className="h-10"
          />

          <ul className="max-h-72 overflow-y-auto">
            {visibleHits.map((hit) => (
              <li key={hit.id}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => go(hit.id)}
                  className="h-auto w-full flex-col items-start gap-0.5 px-2 py-2 text-left"
                >
                  <span className="text-sm font-medium">{hit.title}</span>
                  <span className="text-xs text-muted-foreground">
                    #{hit.rank} on the board
                  </span>
                </Button>
              </li>
            ))}

            {query.trim() && visibleHits.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                Nothing matches that yet.
              </li>
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
