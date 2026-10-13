"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { BookingBar } from "@/components/hero/BookingBar";
import { HeroVehicle } from "@/components/hero/HeroVehicle";
import { VehicleCategorySelector } from "@/components/hero/VehicleCategorySelector";
import { getHeroVehicle, type HeroCategory } from "@/data/vehicles";
import { formatINR } from "@/lib/currency";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const vehicleRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const moveXRef = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const moveYRef = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const [activeCategory, setActiveCategory] = useState<HeroCategory>("suv");
  const vehicle = getHeroVehicle(activeCategory);
  const [statsVehicle, setStatsVehicle] = useState(vehicle);
  const [statsTransitionRevision, setStatsTransitionRevision] = useState(0);
  const statsRef = useRef<HTMLDListElement>(null);
  const statsTransitionIdRef = useRef(0);
  const initialStatsVehicleRef = useRef(vehicle.id);
  const price = formatINR(statsVehicle.pricePerDay);

  useEffect(() => {
    const hero = heroRef.current;
    const vehicleElement = vehicleRef.current;
    const artwork = artworkRef.current;
    if (!hero || !vehicleElement || !artwork) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set("[data-hero-eyebrow], [data-hero-heading-line], [data-hero-controls], [data-hero-stats], [data-hero-floating], [data-hero-booking], .hero-vehicle, [data-hero-frame]", {
          clearProps: "transform,opacity,visibility",
        });
        return;
      }

      const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
      const eyebrow = hero.querySelectorAll<HTMLElement>("[data-hero-eyebrow]");
      if (eyebrow.length) {
        entrance.fromTo(
          eyebrow,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.56 },
        );
      }

      const headingLines = hero.querySelectorAll<HTMLElement>(
        "[data-hero-heading-line]",
      );
      if (headingLines.length) {
        entrance.fromTo(
          headingLines,
          { autoAlpha: 0, yPercent: 110 },
          { autoAlpha: 1, yPercent: 0, duration: 0.84, stagger: 0.11 },
          "-=0.18",
        );
      }

      const controls = hero.querySelectorAll<HTMLElement>(
        "[data-hero-controls]",
      );
      if (controls.length) {
        entrance.fromTo(
          controls,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.58 },
          "-=0.28",
        );
      }

      const stats = hero.querySelectorAll<HTMLElement>("[data-hero-stats]");
      if (stats.length) {
        entrance.fromTo(
          stats,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.5 },
          "-=0.18",
        );
      }

      const heroFrame = artwork.querySelector<HTMLElement>("[data-hero-frame]");
      if (heroFrame) {
        entrance.fromTo(
          heroFrame,
          {
            autoAlpha: 0,
            x: 100,
            y: 20,
            scale: 1.05,
            filter: "blur(8px)",
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 1.1,
            ease: "power3.out",
          },
          "-=0.42",
        );
      }

      const floatingNotes = hero.querySelectorAll<HTMLElement>(
        "[data-hero-floating]",
      );
      if (floatingNotes.length) {
        entrance.fromTo(
          floatingNotes,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.54 },
          "-=0.52",
        );
      }

      const booking = hero.querySelectorAll<HTMLElement>(
        "[data-hero-booking]",
      );
      if (booking.length) {
        entrance.fromTo(
          booking,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.72 },
          "-=0.32",
        );
      }

      gsap.to(vehicleElement, {
        y: -8,
        duration: 3.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        overwrite: true,
      });

      const scrollAnimation = gsap
        .timeline({ defaults: { ease: "none" } })
        .to(vehicleElement, { y: -16, autoAlpha: 0.94 }, 0);
      const heading = hero.querySelectorAll<HTMLElement>("[data-hero-heading]");
      if (heading.length) {
        scrollAnimation.to(heading, { y: -10 }, 0);
      }

      ScrollTrigger.create({
        animation: scrollAnimation,
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
      });

      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        moveXRef.current = gsap.quickTo(artwork, "x", {
          duration: 0.8,
          ease: "power3.out",
          overwrite: "auto",
        });
        moveYRef.current = gsap.quickTo(artwork, "y", {
          duration: 0.8,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    }, hero);

    return () => {
      gsap.killTweensOf(artwork);
      gsap.killTweensOf(vehicleElement);
      context.revert();
      moveXRef.current = null;
      moveYRef.current = null;
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (
        event.pointerType !== "mouse" ||
        !moveXRef.current ||
        !moveYRef.current ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      moveXRef.current(x * 10);
      moveYRef.current(y * 6);
    },
    [],
  );

  const resetParallax = useCallback(() => {
    moveXRef.current?.(0);
    moveYRef.current?.(0);
  }, []);

  function handleCategoryChange(category: HeroCategory) {
    if (category === activeCategory) return;

    setActiveCategory(category);
    const stats = statsRef.current;
    const transitionId = ++statsTransitionIdRef.current;

    if (!stats) {
      setStatsVehicle(getHeroVehicle(category));
      return;
    }

    gsap.killTweensOf(stats);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStatsVehicle(getHeroVehicle(category));
      gsap.set(stats, { clearProps: "transform,opacity,visibility" });
      return;
    }

    gsap.to(stats, {
      autoAlpha: 0,
      y: -8,
      duration: 0.16,
      ease: "power2.in",
      onComplete: () => {
        if (transitionId === statsTransitionIdRef.current) {
          setStatsVehicle(getHeroVehicle(category));
          setStatsTransitionRevision((revision) => revision + 1);
        }
      },
    });
  }

  useLayoutEffect(() => {
    if (statsVehicle.id === initialStatsVehicleRef.current) {
      initialStatsVehicleRef.current = "";
      return;
    }

    const stats = statsRef.current;
    if (!stats) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(stats, { clearProps: "transform,opacity,visibility" });
      return;
    }

    gsap.fromTo(
      stats,
      { autoAlpha: 0, y: 8 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.34,
        ease: "power2.out",
        clearProps: "transform,opacity,visibility",
      },
    );
  }, [statsTransitionRevision, statsVehicle]);

  return (
    <section
      className="hero"
      data-hero
      onPointerLeave={resetParallax}
      onPointerMove={handlePointerMove}
      ref={heroRef}
    >
      <div className="site-container hero__inner">
        <div className={`hero__composition hero__composition--${activeCategory}`}>
          <div className="hero__copy" />

          <HeroVehicle
            artworkRef={artworkRef}
            vehicle={vehicle}
            vehicleRef={vehicleRef}
          />

          <aside className="hero-note" data-hero-floating>
            <span aria-hidden="true" className="hero-note__indicator" />
            <p>Premium cars, ready when you are.</p>
          </aside>

          <div className="hero__details">
            <VehicleCategorySelector
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
            <dl
              aria-live="polite"
              className="hero-stats"
              data-hero-stats
              ref={statsRef}
            >
              <div className="hero-stats__item">
                <dt>0–100 km/h</dt>
                <dd>{statsVehicle.acceleration.toFixed(1)}s</dd>
              </div>
              <div className="hero-stats__item">
                <dt>Power</dt>
                <dd>{statsVehicle.horsepower} <span>hp</span></dd>
              </div>
              <div className="hero-stats__item">
                <dt>From</dt>
                <dd>{price}<span>/day</span></dd>
              </div>
            </dl>
          </div>
        </div>

        <BookingBar vehicleSlug={vehicle.slug} />
      </div>
    </section>
  );
}
