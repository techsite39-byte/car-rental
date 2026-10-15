"use client";

import Image from "next/image";
import {
  useFleetCinematicAnimation,
  CINEMATIC_SCENES,
} from "@/components/fleet/useFleetCinematicAnimation";
import "./FleetCinematicSection.css";

export function FleetCinematicSection() {
  const { sectionRef, canvasRef, fallbackRef, overlayRef, isReady } =
    useFleetCinematicAnimation();

  return (
    <section
      aria-label="BMW M cinematic performance showcase"
      className={`fleet-cinematic${isReady ? " fleet-cinematic--ready" : ""}`}
      ref={sectionRef}
    >
      <Image
        alt="BMW M performance journey"
        className="fleet-cinematic__fallback"
        decoding="async"
        draggable={false}
        fetchPriority="high"
        height={720}
        priority={false}
        ref={fallbackRef}
        src="/newsec/frame_001.jpg"
        unoptimized
        width={1280}
      />
      <canvas
        aria-hidden="true"
        className="fleet-cinematic__canvas"
        ref={canvasRef}
      />

      <div className="fleet-cinematic__vignette" />

      <div className="fleet-cinematic__overlay" ref={overlayRef}>
        <div className="fleet-cinematic__badge">
          <span className="fleet-cinematic__indicator-dot" />
          <span>Cinematic Showcase // M Edition</span>
        </div>

        <div className="fleet-cinematic__scenes">
          {CINEMATIC_SCENES.map((scene) => (
            <article
              className="fleet-cinematic__scene-card"
              data-scene-id={scene.id}
              key={scene.id}
            >
              <span className="fleet-cinematic__scene-eyebrow">
                {scene.eyebrow}
              </span>
              <h2 className="fleet-cinematic__scene-title">{scene.title}</h2>
              <p className="fleet-cinematic__scene-desc">{scene.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
