import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "./components/ui/CookieBanner";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolabel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "AutoLabel - Automate Your Shipping Label Processing | Email to Print",
  description: "Scan emails, normalize labels to 100×150mm (4×6\"), and print in bulk - all automatically. Save hours every day with AutoLabel for resellers.",
  keywords: [
    "shipping labels",
    "label automation",
    "reseller tools",
    "vinted",
    "ebay",
    "batch printing",
    "DHL",
    "Hermes",
    "DPD",
    "GLS",
    "UPS",
    "automatic label printing",
    "email to label",
    "shipping label automation",
    "automatic label printing",
    "email to label printing",
    "batch label printing",
    "shipping label software",
    "Versandetikett automatisch",
  ],
  authors: [{ name: "AutoLabel" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "AutoLabel - Automate Your Shipping Label Processing | Email to Print",
    description: "Scan emails, normalize labels to 100×150mm (4×6\"), and print in bulk - all automatically. Save hours every day with AutoLabel for resellers.",
    type: "website",
    url: baseUrl,
    siteName: "AutoLabel",
    images: [
      {
        url: "/logo/logo.png",
        width: 1200,
        height: 630,
        alt: "AutoLabel Logo - Shipping Label Automation Software",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoLabel - Automate Your Shipping Label Processing | Email to Print",
    description: "Scan emails, normalize labels to 100×150mm (4×6\"), and print in bulk - all automatically. Save hours every day with AutoLabel for resellers.",
    images: ["/logo/logo.png"],
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
