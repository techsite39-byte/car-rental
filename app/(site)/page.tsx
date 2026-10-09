import { Hero } from "@/components/hero/Hero";
import { DealsSection } from "@/components/deals/DealsSection";
import { JourneySection } from "@/components/experience/JourneySection";
import { FleetSection } from "@/components/fleet/FleetSection";
import { PostFleetSections } from "@/components/homepage/PostFleetSections";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <DealsSection />
      <JourneySection />
      <FleetSection />
      <PostFleetSections />
    </main>
  );
}
