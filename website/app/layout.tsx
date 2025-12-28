import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoLabel - Automate Your Shipping Label Processing",
  description: "Scan emails, normalize labels to 100×150mm, and print in bulk - all automatically. Save hours every day with AutoLabel for resellers.",
  keywords: ["shipping labels", "label automation", "reseller tools", "vinted", "ebay", "batch printing"],
  authors: [{ name: "AutoLabel" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "AutoLabel - Automate Your Shipping Label Processing",
    description: "Scan emails, normalize labels to 100×150mm, and print in bulk - all automatically.",
    type: "website",
    images: [{ url: "/logo/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoLabel - Automate Your Shipping Label Processing",
    description: "Scan emails, normalize labels to 100×150mm, and print in bulk - all automatically.",
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
      </body>
    </html>
  );
}
