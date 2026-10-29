import { HomeVideoHero } from "@/components/hero/FrameSequenceHero";
import { HomeDeferredSections } from "@/components/homepage/HomeDeferredSections";
import { HomeBookingSection } from "@/components/homepage/HomeBookingSection";

export default function HomePage() {
  return (
    <main className="home-page">
      <HomeVideoHero />
      <HomeBookingSection />
      <HomeDeferredSections />
    </main>
  );
}
