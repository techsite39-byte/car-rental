import { FrameSequenceHero } from "@/components/hero/FrameSequenceHero";
import { Section2ScrollHero } from "@/components/hero/Section2ScrollHero";
import { CustomerTestimonials } from "@/components/homepage/CustomerTestimonials";
import { StatisticsSection } from "@/components/homepage/StatisticsSection";
import { JourneyRulesSection } from "@/components/homepage/PostFleetSections";
import { OpenRoadSteps } from "@/components/homepage/OpenRoadSteps";
import { Hero } from "@/components/hero/Hero";
import { DealsSection } from "@/components/deals/DealsSection";
import { JourneySection } from "@/components/experience/JourneySection";
import { FleetSection } from "@/components/fleet/FleetSection";
import { FleetCinematicSection } from "@/components/fleet/FleetCinematicSection";
import { PostFleetSections } from "@/components/homepage/PostFleetSections";

export default function HomePage() {
  return (
    <main className="home-page">
      <FrameSequenceHero />
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
    </main>
  );
}
