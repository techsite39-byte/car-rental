import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { WhyChooseSection } from "@/components/homepage/WhyChooseSection";
import { Navbar } from "@/components/layout/Navbar";

export default function PublicSiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <WhyChooseSection />
      <Footer />
    </>
  );
}
