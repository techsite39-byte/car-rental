"use client";

import Image from "next/image";
import Link from "next/link";
import { useSection2Animation } from "@/components/hero/useSection2Animation";
import { SECTION2_TEXT_SCENES } from "@/components/hero/section2TextScenes";
import "./Section2ScrollHero.css";

export function Section2ScrollHero() {
  const { sectionRef, canvasRef, fallbackRef, overlayRef, isReady } = useSection2Animation();

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
        src="/sec2/frame_001.jpg"
        unoptimized
        width={1280}
      />
      <canvas
        aria-hidden="true"
        className="section2-sequence__canvas"
        ref={canvasRef}
      />

      <div className="section2-overlay" ref={overlayRef}>
        {SECTION2_TEXT_SCENES.map((scene) => (
          <article
            className={`section2-text-scene ${scene.positionClass}`}
            data-text-scene={scene.id}
            key={scene.id}
          >
            {scene.eyebrow && (
              <span className="section2-text__eyebrow">{scene.eyebrow}</span>
            )}
            <h2 className="section2-text__headline">{scene.headline}</h2>
            <p className="section2-text__supporting">{scene.supporting}</p>
            {scene.ctaText && scene.ctaHref && (
              <Link className="section2-text__cta" href={scene.ctaHref}>
                <span>{scene.ctaText}</span>
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
