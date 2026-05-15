// Root layout — wraps every page with the navbar and footer.
// Loads global CSS once and exports site-wide metadata + viewport config.

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  // The "%s | KSFH Meals" template lets individual pages set a short title
  // and have the site name appended automatically.
  title: {
    default: "KSFH Meals",
    template: "%s | KSFH Meals",
  },
  description:
    "K-State FarmHouse meal sign-ups, weekly menu, and plate counts.",
  applicationName: "KSFH Meals",
  appleWebApp: {
    capable: true,
    title: "KSFH Meals",
    statusBarStyle: "default",
  },
  // OG / Twitter cards so iMessage / Discord / Slack previews don't render blank.
  openGraph: {
    type: "website",
    siteName: "KSFH Meals",
    title: "KSFH Meals",
    description:
      "K-State FarmHouse meal sign-ups, weekly menu, and plate counts.",
  },
  twitter: {
    // summary_large_image renders the crest prominently in Twitter / X cards.
    // Next auto-injects /opengraph-image.png since that file exists in app/.
    card: "summary_large_image",
    title: "KSFH Meals",
    description:
      "K-State FarmHouse meal sign-ups, weekly menu, and plate counts.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Matches the brand green; tints the Android browser address bar and the
  // iOS PWA status bar when installed.
  themeColor: "#004d2d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
