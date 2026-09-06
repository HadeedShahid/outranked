import { httpClient } from "@/lib/network/http-client";

export function trackClick(listingId: string) {
  return httpClient.post<{ ok: true }>(`/api/listings/${encodeURIComponent(listingId)}/click`);
}

export interface SearchHit {
  id: string;
  title: string;
  rank: number;
}

export function searchListings(q: string) {
  return httpClient.get<SearchHit[]>("/api/search", { q });
}
