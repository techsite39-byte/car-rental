"use client";

import Image from "next/image";
import { useScrollFrameSequence } from "@/components/hero/useScrollFrameSequence";
import "./FrameSequenceHero.css";

const FRAME_COUNT = 116;

function getFrameUrl(frame: number) {
  return `/frame1/frame_${String(frame).padStart(3, "0")}.jpg`;
}

export function FrameSequenceHero() {
  const { sectionRef, canvasRef, fallbackRef, isReady } = useScrollFrameSequence({
    frameCount: FRAME_COUNT,
    initialFrame: 1,
    getFrameUrl,
    mobileCacheSize: 30,
    desktopCacheSize: 60,
    priority: true,
  });

  return (
    <section
      aria-label="Automotive frame sequence"
      className={`frame-sequence${isReady ? " frame-sequence--ready" : ""}`}
      ref={sectionRef}
    >
      <Image
        alt="BMW automotive showcase"
        className="frame-sequence__fallback"
        decoding="async"
        draggable={false}
        fetchPriority="high"
        height={720}
        priority
        ref={fallbackRef}
        src={getFrameUrl(1)}
        unoptimized
        width={1280}
      />
      <canvas
        aria-hidden="true"
        className="frame-sequence__canvas"
        ref={canvasRef}
      />
    </section>
  );
}
