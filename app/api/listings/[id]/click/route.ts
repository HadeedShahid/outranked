import { NextResponse } from "next/server";
import { recordClick } from "@/lib/data/listings";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await recordClick(decodeURIComponent(id));
  if (!ok) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
