import { FrameSequenceHero } from "@/components/hero/FrameSequenceHero";
import { Section2ScrollHero } from "@/components/hero/Section2ScrollHero";
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
      <OpenRoadSteps />
      <Hero />
      <DealsSection />
      <JourneySection />
      <FleetSection />
      <FleetCinematicSection />
      <PostFleetSections />
    </main>
  );
}
