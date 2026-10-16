"use client";

import dynamic from "next/dynamic";

const Section2ScrollHero = dynamic(
  () => import("@/components/hero/Section2ScrollHero").then((mod) => mod.Section2ScrollHero),
  { loading: () => <DeferredSectionPlaceholder className="home-deferred-placeholder--sequence" /> },
);
const StatisticsSection = dynamic(
  () => import("@/components/homepage/StatisticsSection").then((mod) => mod.StatisticsSection),
  { loading: () => <DeferredSectionPlaceholder /> },
);
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
const FleetCinematicSection = dynamic(
  () => import("@/components/fleet/FleetCinematicSection").then((mod) => mod.FleetCinematicSection),
  { loading: () => <DeferredSectionPlaceholder className="home-deferred-placeholder--cinematic" /> },
);
const JourneyRulesSection = dynamic(
  () => import("@/components/homepage/PostFleetSections").then((mod) => mod.JourneyRulesSection),
  { loading: () => <DeferredSectionPlaceholder /> },
);
const CustomerTestimonials = dynamic(
  () => import("@/components/homepage/CustomerTestimonials").then((mod) => mod.CustomerTestimonials),
  { loading: () => <DeferredSectionPlaceholder /> },
);
const DealsSection = dynamic(
  () => import("@/components/deals/DealsSection").then((mod) => mod.DealsSection),
  { loading: () => <DeferredSectionPlaceholder /> },
);
const JourneySection = dynamic(
  () => import("@/components/experience/JourneySection").then((mod) => mod.JourneySection),
  { loading: () => <DeferredSectionPlaceholder /> },
);
const PostFleetSections = dynamic(
  () => import("@/components/homepage/PostFleetSections").then((mod) => mod.PostFleetSections),
  { loading: () => <DeferredSectionPlaceholder /> },
);

function DeferredSectionPlaceholder({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`home-deferred-placeholder ${className}`} />;
}

export function HomeDeferredSections() {
  return (
    <>
      <Section2ScrollHero />
      <StatisticsSection />
      <OpenRoadSteps />
      <Hero />
      <FleetSection />
      <FleetCinematicSection />
      <JourneyRulesSection />
      <CustomerTestimonials />
      <DealsSection />
      <JourneySection />
      <PostFleetSections />
    </>
  );
}
