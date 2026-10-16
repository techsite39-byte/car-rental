"use client";

import { useScrollFrameSequence } from "@/components/hero/useScrollFrameSequence";
import "./FrameSequenceHero.css";

/* eslint-disable @next/next/no-img-element */

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
      <img
        alt="BMW automotive showcase"
        className="frame-sequence__fallback"
        decoding="async"
        draggable={false}
        height={720}
        loading="eager"
        ref={fallbackRef}
        src={getFrameUrl(1)}
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
