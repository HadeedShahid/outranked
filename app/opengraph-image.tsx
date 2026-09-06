import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/domain/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — a free leaderboard you can climb`;

/**
 * Share card for the site.
 *
 * Hand-built rather than a screenshot of the board, because the board changes
 * hourly and a cached card of yesterday's standings is worse than no card.
 * Type only — Satori has no browser to load webfonts or remote images from, so
 * anything fetched here is a failure mode in exchange for decoration.
 */
export default function Image() {
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

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Two elements in a flex column, not one div with a <br>: Satori
              requires an explicit display on any node with more than one
              child, and a line break counts as one. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 104,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 1.05,
              color: "#0a0a0a",
            }}
          >
            <div>100 spots.</div>
            <div>Free to claim.</div>
          </div>
          <div style={{ fontSize: 34, color: "#5f6570" }}>
            Hold yours for 24 hours. Then anyone can take it.
          </div>
        </div>

        <div style={{ display: "flex", height: 10, background: "#d92e0f", width: 220 }} />
      </div>
    ),
    size
  );
}
