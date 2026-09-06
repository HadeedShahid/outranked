import { ImageResponse } from "next/og";
import { getListing } from "@/lib/data/listings";
import { SITE_NAME } from "@/lib/domain/site";
import { displayHost } from "@/lib/domain/url";
import { billingName } from "@/lib/utils/billing-name";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Listing standing";

/**
 * Share card for one listing: its name and where it stands.
 *
 * The rank is the whole point of the card — a shared link that says "#3 of 100"
 * carries the product's premise without the reader opening it.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(decodeURIComponent(id));

  const name = listing ? billingName(listing.title) : "Not found";
  const host = listing ? displayHost(listing.url) : "";
  const standing =
    listing && listing.rank !== null ? `#${listing.rank}` : listing ? "archived" : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 18, height: 18, background: "#d92e0f" }} />
          <div style={{ fontSize: 30, fontWeight: 700, color: "#0a0a0a" }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#d92e0f" }}>{standing}</div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 1,
              color: "#0a0a0a",
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 32, color: "#5f6570" }}>{host}</div>
        </div>

        <div style={{ fontSize: 26, color: "#5f6570" }}>
          Every spot is free and contestable every 24 hours.
        </div>
      </div>
    ),
    size
  );
}
