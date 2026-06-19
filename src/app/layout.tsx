import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = "https://www.vancompass.co.uk";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "VanCompass — UK Van Life Companion Map",
  description:
    "Surf, kite, fishing, wild camping, weather and van services — all on one live map. VanCompass helps van travellers find good spots and know before they go.",
  openGraph: {
    title: "VanCompass — UK Van Life Companion Map",
    description:
      "Surf, kite, fishing, wild camping, weather and van services — all on one live map.",
    url: siteUrl,
    siteName: "VanCompass",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VanCompass — UK Van Life Companion Map",
    description:
      "Surf, kite, fishing, wild camping, weather and van services — all on one live map.",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#06080d] text-zinc-100">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
