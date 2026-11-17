import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ServiceWorker } from "@/components/feature/ServiceWorker";
import { THEME_SCRIPT } from "@/lib/themeScript";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: { default: "Stall Tracker", template: "%s · Stall Tracker" },
  description: "Record sales and expenses, close the day and see your profit.",
  applicationName: "Stall Tracker",
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  // iPhone: open full screen from the home screen, with this name under the icon.
  appleWebApp: { capable: true, title: "Stall", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Matches --color-canvas in light and dark (src/client/theme.ts updates it on a manual switch).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e12" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set by THEME_SCRIPT before React loads, hence suppressHydrationWarning.
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ServiceWorker />
        {/* Phone-sized column, centred on bigger screens. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">{children}</div>
      </body>
    </html>
  );
}
