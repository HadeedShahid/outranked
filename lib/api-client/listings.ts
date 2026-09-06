import { httpClient } from "@/lib/network/http-client";

export interface ClaimRequest {
  target: string;
  slot: number;
  expectedListingId: string | null;
  turnstileToken: string;
}

export interface ClaimSuccess {
  listingId: string;
  rank: number | null;
  unfreezeEarliest: string;
  recoveryCode?: string;
}

export function submitClaim(input: ClaimRequest) {
  return httpClient.post<ClaimSuccess>("/api/claim", input);
}

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
