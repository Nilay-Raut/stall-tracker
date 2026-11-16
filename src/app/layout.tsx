import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ServiceWorker } from "@/components/feature/ServiceWorker";
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
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
      <body>
        <ServiceWorker />
        {/* Phone-sized column, centred on bigger screens. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">{children}</div>
      </body>
    </html>
  );
}
