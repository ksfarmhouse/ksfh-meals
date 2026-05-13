// Root layout — wraps every page with the navbar and footer.
// Loads global CSS once and exports site-wide metadata + viewport config.

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "KSFH Meals",
  description: "K-State FarmHouse meal sign-ups, weekly menu, and plate counts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
