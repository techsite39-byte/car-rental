"use client";

import dynamic from "next/dynamic";
import { FleetBannerSlider } from "@/components/homepage/FleetBannerSlider";
import { StatisticsSection } from "@/components/homepage/StatisticsSection";
import { TrustBanner } from "@/components/homepage/TrustBanner";

const OpenRoadSteps = dynamic(
  () => import("@/components/homepage/OpenRoadSteps").then((mod) => mod.OpenRoadSteps),
  { loading: () => <DeferredSectionPlaceholder /> },
);
const Hero = dynamic(
  () => import("@/components/hero/Hero").then((mod) => mod.Hero),
  { loading: () => <DeferredSectionPlaceholder /> },
);
const FleetSection = dynamic(
  () => import("@/components/fleet/FleetSection").then((mod) => mod.FleetSection),
  { loading: () => <DeferredSectionPlaceholder /> },
);
const CustomerTestimonials = dynamic(
  () => import("@/components/homepage/CustomerTestimonials").then((mod) => mod.CustomerTestimonials),
  { loading: () => <DeferredSectionPlaceholder /> },
);

function DeferredSectionPlaceholder({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`home-deferred-placeholder ${className}`} />;
}

export function HomeDeferredSections() {
  return (
    <>
      <StatisticsSection />
      <OpenRoadSteps />
      <Hero />
      <FleetBannerSlider />
      <FleetSection />
      <TrustBanner />
      <CustomerTestimonials />
    </>
  );
}
