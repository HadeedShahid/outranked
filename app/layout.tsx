import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/domain/site";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ClaimDialogProvider } from "@/components/board/claim-dialog-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FeatureBanner } from "@/components/ads/feature-banner";
import { SideRail } from "@/components/ads/side-rail";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // `default` is what the home page and any untitled route get; `template`
  // wraps every child route's own title. Child pages therefore set only their
  // own name, and the suffix can be changed in one place.
  title: {
    default: "outrank — a free leaderboard you can climb",
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,

  // Google has ignored this tag since 2009 and Bing treats it as a spam
  // signal at best. Kept short and honest because a few smaller engines and
  // internal search tools still read it; the real keyword work lives in the
  // titles, headings and body copy.
  keywords: [
    "free product directory",
    "startup leaderboard",
    "submit your website free",
    "free backlink directory",
    "indie product listing",
    "business directory",
  ],

  alternates: { canonical: "/" },

  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "outrank — a free leaderboard you can climb",
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "outrank — a free leaderboard you can climb",
    description: SITE_DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Without these Google may show only a thumbnail and a clipped snippet.
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {/* Above the page, so a board update cannot unmount the claim
              dialog while it is showing a one-time recovery code. */}
          <ClaimDialogProvider>
            <SiteHeader />
            {/* Banner spans the top; rails hang below it. Both use the same
                max-width and padding, so the banner's bottom corners land exactly
                on the rails' top outer corners. Previously the banner was
                centred independently at a narrower max-width, which is why it
                drifted over the rails at some viewport sizes. */}
            <FeatureBanner />
            {/* Rails only appear from xl up, where there's genuinely spare width
                either side of the board. Below that they'd cost the content more
                than the inventory is worth. */}
            <div className="mx-auto flex w-full max-w-[1600px] flex-1 justify-center gap-6 px-0 xl:px-6">
              <SideRail />
              <div className="min-w-0 flex-1">{children}</div>
              <SideRail />
            </div>
            <SiteFooter />
            <SpeedInsights/>
            <Analytics/>
          </ClaimDialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
