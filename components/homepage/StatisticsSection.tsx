"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, CarFront, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import "./statistics-section.css";

const STATISTICS = [
  { value: 1000, suffix: "+", label: "Cars to choose from", icon: CarFront, animate: true },
  { value: 12, suffix: "+", label: "Convenient Locations", icon: MapPin, animate: true },
  { value: 15, suffix: "+", label: "Years of Experience", icon: CalendarDays, animate: true },
  { value: 10, suffix: "M+", label: "Happy Customers", icon: UsersRound, animate: true },
  { value: 24, suffix: "/7", label: "Roadside Assistance", icon: ShieldCheck, animate: false },
] as const;

export function StatisticsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const hasStartedRef = useRef(false);
  const [counts, setCounts] = useState(() => STATISTICS.map(() => 0));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const startCounting = () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      const finalCounts = STATISTICS.map((statistic) => statistic.value);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setCounts(finalCounts);
        return;
      }

      const duration = 1400;
      const startedAt = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setCounts(
          STATISTICS.map((statistic) =>
            statistic.animate
              ? Math.round(statistic.value * easedProgress)
              : statistic.value,
          ),
        );

        if (progress < 1) {
          animationFrameRef = requestAnimationFrame(animate);
        }
      };

      animationFrameRef = requestAnimationFrame(animate);
    };

    let animationFrameRef = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCounting();
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      if (animationFrameRef) cancelAnimationFrame(animationFrameRef);
    };
  }, []);

  return (
    <section aria-label="EPICDRIVE at a glance" className="home-statistics" ref={sectionRef}>
      <div className="home-statistics__inner">
        <div className="home-statistics__grid">
          {STATISTICS.map((statistic, index) => {
            const Icon = statistic.icon;
            const displayValue = `${statistic.animate ? counts[index] : statistic.value}${statistic.suffix}`;

            return (
              <article className="home-statistics__item" key={statistic.label}>
                <div className="home-statistics__summary">
                  <span aria-hidden="true" className="home-statistics__icon">
                    <Icon size={22} strokeWidth={2.2} />
                  </span>
                  <strong className="home-statistics__value">{displayValue}</strong>
                </div>
                <p className="home-statistics__label">{statistic.label}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
