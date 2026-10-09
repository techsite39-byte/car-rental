import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `${siteConfig.brand.name} — Premium Car Rental`,
  description: "Premium vehicles for exceptional journeys.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#070807",
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
