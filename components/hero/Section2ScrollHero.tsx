"use client";

import Image from "next/image";
import { useSection2Animation } from "@/components/hero/useSection2Animation";
import "./Section2ScrollHero.css";

export function Section2ScrollHero() {
  const { sectionRef, canvasRef, fallbackRef, isReady } = useSection2Animation();

  return (
    <section
      aria-label="Second automotive frame sequence"
      className={`section2-sequence${isReady ? " section2-sequence--ready" : ""}`}
      ref={sectionRef}
    >
      <Image
        alt="BMW cinematic journey sequence"
        className="section2-sequence__fallback"
        decoding="async"
        draggable={false}
        fetchPriority="high"
        height={720}
        priority
        ref={fallbackRef}
        src="/section2/frame_001.jpg"
        unoptimized
        width={1280}
      />
      <canvas
        aria-hidden="true"
        className="section2-sequence__canvas"
        ref={canvasRef}
      />
    </section>
  );
}
