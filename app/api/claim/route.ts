import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { ARCHIVE_TAG, BOARD_TAG, submitClaim } from "@/lib/data/listings";
import { hashIp, OWNER_COOKIE } from "@/lib/domain/ownership";
import { verifyTurnstile } from "@/lib/domain/turnstile";

interface ClaimBody {
  target?: string;
  slot?: number;
  expectedListingId?: string | null;
  turnstileToken?: string;
}

export async function POST(request: Request) {
  // Same-origin only. Without this, a third-party page could auto-submit a
  // claim and the visitor's ownership cookie would ride along with it.
  const headerList = await headers();
  const origin = headerList.get("origin");
  const host = headerList.get("host");
  if (origin && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Bad origin." }, { status: 403 });
  }

  const body = (await request.json()) as ClaimBody;
  if (!body.target || typeof body.slot !== "number") {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip");

  if (!(await verifyTurnstile(body.turnstileToken ?? "", ip ?? undefined))) {
    return NextResponse.json(
      { error: "Verification failed. Reload and try again.", code: "BAD_CAPTCHA" },
      { status: 400 }
    );
  }

  const jar = await cookies();

  const result = await submitClaim({
    target: body.target,
    slot: body.slot,
    expectedListingId: body.expectedListingId ?? null,
    turnstileToken: body.turnstileToken ?? "",
    ownerToken: jar.get(OWNER_COOKIE)?.value,
    ipHash: hashIp(ip),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 409 });
  }

  // A claim reorders the board and may push a listing into the archive.
  // revalidateTag rather than updateTag: updateTag only works in Server
  // Actions, not Route Handlers.
  revalidateTag(BOARD_TAG, "seconds");
  revalidateTag(ARCHIVE_TAG, "seconds");

  const response = NextResponse.json(result);

  // A first claim issues the token. httpOnly so script on the page can't read
  // it; SameSite=Lax so it doesn't ride along on cross-site requests.
  if (result.recoveryCode) {
    response.cookies.set(OWNER_COOKIE, result.recoveryCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}
