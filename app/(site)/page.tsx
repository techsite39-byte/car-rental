import { Hero } from "@/components/hero/Hero";
import { DealsSection } from "@/components/deals/DealsSection";
import { JourneySection } from "@/components/experience/JourneySection";
import { FleetSection } from "@/components/fleet/FleetSection";
import { PostFleetSections } from "@/components/homepage/PostFleetSections";
import { Car3DSection } from "@/components/car3d/Car3DSection";

export default function HomePage() {
  return (
    <main>
      <Car3DSection />
      <Hero />
      <DealsSection />
      <JourneySection />
      <FleetSection />
      <PostFleetSections />
    </main>
  );
}
