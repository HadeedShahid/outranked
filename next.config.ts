import type { NextConfig } from "next";

/**
 * No `images.remotePatterns`: listing avatars come from arbitrary user-submitted
 * domains, so they render through a plain <img> rather than next/image — see
 * components/listing/listing-avatar.tsx.
 */
const nextConfig: NextConfig = {
  // Enables `use cache`, `cacheTag` and `cacheLife`, and makes partial
  // prerendering the default so a static shell streams while data loads.
  cacheComponents: true,
  experimental: {
    // Emits CSS as inline <style> instead of <link>, removing a render-blocking
    // round trip on first paint.
    inlineCss: true,
  },
};

export default nextConfig;
