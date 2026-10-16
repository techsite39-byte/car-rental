"use client";

import { useEffect, useRef } from "react";
import { vehicles } from "@/data/vehicles";
import "./statistics-section.css";

const sevenSeatVehicleCount = vehicles.filter(
  (vehicle) => vehicle.seats === 7,
).length;
const vehicleCategoryCount = new Set(
  vehicles.map((vehicle) => vehicle.category),
).size;

const STATISTICS = [
  { target: vehicles.length, suffix: "", display: String(vehicles.length), label: "Cars in Fleet" },
  { target: sevenSeatVehicleCount, suffix: "", display: String(sevenSeatVehicleCount), label: "Seven-seat vehicles" },
  { target: vehicleCategoryCount, suffix: "", display: String(vehicleCategoryCount), label: "Vehicle categories" },
  { target: null, suffix: "", display: "Madurai", label: "Service location" },
] as const;

const ANIMATION_DURATION = 1500;

export function StatisticsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const values = section.querySelectorAll<HTMLElement>("[data-stat-value]");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      section.dataset.visible = "true";
      return;
    }

    for (const value of values) {
      if (value.dataset.statTarget !== undefined) {
        value.textContent = `0${value.dataset.statSuffix ?? ""}`;
      }
    }

    let animationFrame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        observer.disconnect();
        section.dataset.visible = "true";
        const startedAt = performance.now();

        const animate = (now: number) => {
          const progress = Math.min((now - startedAt) / ANIMATION_DURATION, 1);
          const easedProgress = 1 - (1 - progress) ** 3;

          values.forEach((value, index) => {
            const statistic = STATISTICS[index];
            if (statistic?.target === null || !statistic) return;

            const count = Math.round(statistic.target * easedProgress);
            value.textContent = `${count}${statistic.suffix}`;
          });

          if (progress < 1) {
            animationFrame = requestAnimationFrame(animate);
          }
        };

        animationFrame = requestAnimationFrame(animate);
      },
      { threshold: 0.25 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section
      aria-labelledby="statistics-heading"
      className="home-statistics"
      ref={sectionRef}
    >
      <div className="home-statistics__inner">
        <h2 className="home-statistics__heading" id="statistics-heading">
          EPICDRIVE Fleet at a Glance
        </h2>

        <div className="home-statistics__grid">
          {STATISTICS.map((statistic, index) => (
            <article className="home-statistics__card" key={statistic.label}>
              <span
                aria-hidden="true"
                className="home-statistics__value"
                data-stat-suffix={statistic.suffix}
                data-stat-target={statistic.target ?? undefined}
                data-stat-value
              >
                {statistic.display}
              </span>
              <span className="visually-hidden">{statistic.display}</span>
              <p
                className="home-statistics__label"
                data-stat-index={index}
              >
                {statistic.label}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
