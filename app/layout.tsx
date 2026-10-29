import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `${siteConfig.brand.fullName} — ${siteConfig.brand.tagline}`,
  description:
    "Self-drive car rentals in Madurai. Choose from the EPICDRIVE fleet and plan your journey.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ED1C24",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
