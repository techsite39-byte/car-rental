import { Hero } from "@/components/hero/Hero";
import { DealsSection } from "@/components/deals/DealsSection";
import { JourneySection } from "@/components/experience/JourneySection";
import { FleetSection } from "@/components/fleet/FleetSection";
import { PostFleetSections } from "@/components/homepage/PostFleetSections";
import { OpenRoadSteps } from "@/components/homepage/OpenRoadSteps";
import { FrameSequenceHero } from "@/components/hero/FrameSequenceHero";

export default function HomePage() {
  return (
    <main className="home-page">
      <FrameSequenceHero />
      <OpenRoadSteps />
      <Hero />
      <DealsSection />
      <JourneySection />
      <FleetSection />
      <PostFleetSections />
    </main>
  );
}
