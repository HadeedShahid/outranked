import { NextResponse } from "next/server";
import { searchListings } from "@/lib/data/listings";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchListings(q);
  return NextResponse.json(
    results.map((l) => ({ id: l.id, title: l.title, rank: l.rank }))
  );
}
