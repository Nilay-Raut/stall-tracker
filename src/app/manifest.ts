import type { MetadataRoute } from "next";

/** Lets phones install the app ("Add to Home Screen") and open it like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stall Tracker",
    short_name: "Stall",
    description: "Record sales and expenses, close the day and see your profit.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
