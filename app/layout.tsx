import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FeatureBanner } from "@/components/ads/feature-banner";
import { SideRail } from "@/components/ads/side-rail";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "outrank — claim the top spot",
  description: "A public leaderboard where rank is what you pay. Nothing else.",
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
        </ThemeProvider>
      </body>
    </html>
  );
}
