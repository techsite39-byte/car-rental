import { FrameSequenceHero } from "@/components/hero/FrameSequenceHero";
import { HomeDeferredSections } from "@/components/homepage/HomeDeferredSections";

export default function HomePage() {
  return (
    <main className="home-page">
      <FrameSequenceHero />
      <HomeDeferredSections />
    </main>
  );
}
