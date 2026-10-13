"use client";

import Image from "next/image";
import { useScrollFrameSequence } from "@/components/hero/useScrollFrameSequence";
import "./Section2ScrollHero.css";

const FRAME_COUNT = 150;

function getFrameUrl(frame: number) {
  return `/section2/frame_${String(frame + 1).padStart(3, "0")}.jpg`;
}

export function Section2ScrollHero() {
  const { sectionRef, canvasRef, fallbackRef, isReady } = useScrollFrameSequence({
    frameCount: FRAME_COUNT,
    initialFrame: 0,
    getFrameUrl,
    mobileCacheSize: 18,
    desktopCacheSize: 24,
  });

  return (
    <section
      aria-label="Second automotive frame sequence"
      className={`section2-sequence${isReady ? " section2-sequence--ready" : ""}`}
      ref={sectionRef}
    >
      <Image
        alt=""
        className="section2-sequence__fallback"
        decoding="async"
        draggable={false}
        fetchPriority="high"
        height={720}
        ref={fallbackRef}
        src={getFrameUrl(0)}
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
