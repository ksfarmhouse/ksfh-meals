// Web app manifest — lets users "Add to Home Screen" on iOS and Android
// and have KSFH Meals open as a standalone app (no browser chrome).
// Next.js generates /manifest.webmanifest from this file automatically.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KSFH Meals",
    short_name: "KSFH Meals",
    description:
      "K-State FarmHouse meal sign-ups, weekly menu, and plate counts.",
    start_url: "/",
    display: "standalone",
    background_color: "#eaf4ed",
    theme_color: "#004d2d",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  };
}
