"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import type { Vehicle } from "@/data/vehicles";

gsap.registerPlugin(ScrollTrigger);

interface VehicleDetailHeroProps {
  vehicle: Vehicle;
}

const categoryLabels: Record<Vehicle["category"], string> = {
  sport: "Sport",
  suv: "SUV",
  sedan: "Sedan",
  electric: "Electric",
  convertible: "Convertible",
};

const fallbackByCategory: Record<Vehicle["category"], string> = {
  sport: "/images/vehicles/hero-sport-placeholder.svg",
  suv: "/images/vehicles/hero-suv-placeholder.svg",
  sedan: "/images/vehicles/hero-sedan-placeholder.svg",
  electric: "/images/vehicles/hero-electric-placeholder.svg",
  convertible: "/images/vehicles/hero-sport-placeholder.svg",
};

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function VehicleDetailHero({ vehicle }: VehicleDetailHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const imageSrc =
    vehicle.imagePlaceholder ?? fallbackByCategory[vehicle.category];

  useEffect(() => {
    const hero = heroRef.current;
    const artwork = artworkRef.current;
    if (!hero || !artwork) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let cleanupDesktopMotion = () => {};
    const context = gsap.context(() => {
      if (reducedMotion) return;

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          "[data-vehicle-back]",
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.45 },
        )
        .fromTo(
          "[data-vehicle-eyebrow], [data-vehicle-title], [data-vehicle-copy], [data-vehicle-price], [data-vehicle-actions]",
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.1 },
          "-=0.18",
        )
        .fromTo(
          "[data-vehicle-artwork]",
          { autoAlpha: 0, scale: 0.94, x: 24 },
          { autoAlpha: 1, scale: 1, x: 0, duration: 1.05 },
          "-=0.72",
        );

      const desktopQuery = window.matchMedia(
        "(min-width: 1024px) and (hover: hover) and (pointer: fine)",
      );
      const enableDesktopMotion = () => {
        removePointerListeners();
        if (!desktopQuery.matches) return;

        gsap.fromTo(
          artwork,
          { y: -12 },
          {
            y: 12,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: 0.7,
            },
          },
        );

        const moveArtwork = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return;
          const rect = hero.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
          gsap.to(artwork, {
            x,
            duration: 0.8,
            ease: "power2.out",
            overwrite: "auto",
          });
        };
        const resetArtwork = () => {
          gsap.to(artwork, {
            x: 0,
            duration: 0.8,
            ease: "power2.out",
            overwrite: "auto",
          });
        };

        hero.addEventListener("pointermove", moveArtwork);
        hero.addEventListener("pointerleave", resetArtwork);
        removePointerListeners = () => {
          hero.removeEventListener("pointermove", moveArtwork);
          hero.removeEventListener("pointerleave", resetArtwork);
        };
      };

      let removePointerListeners = () => {};
      enableDesktopMotion();
      desktopQuery.addEventListener("change", enableDesktopMotion);
      cleanupDesktopMotion = () => {
        desktopQuery.removeEventListener("change", enableDesktopMotion);
        removePointerListeners();
      };
    }, hero);

    return () => {
      cleanupDesktopMotion();
      context.revert();
    };
  }, []);

  return (
    <section
      aria-labelledby="vehicle-detail-title"
      className="vehicle-detail-hero"
      ref={heroRef}
    >
      <div className="vehicle-detail-hero__atmosphere" aria-hidden="true" />
      <div className="site-container vehicle-detail-hero__inner">
        <div className="vehicle-detail-hero__copy">
          <Link
            className="vehicle-detail-hero__back"
            data-vehicle-back
            href="/fleet"
          >
            <span aria-hidden="true">←</span> Back to fleet
          </Link>
          <p className="vehicle-detail__eyebrow" data-vehicle-eyebrow>
            VÉLOCE <span>/</span> {categoryLabels[vehicle.category]}
          </p>
          <h1
            className="vehicle-detail-hero__title"
            data-vehicle-title
            id="vehicle-detail-title"
          >
            {vehicle.name}
          </h1>
          <p className="vehicle-detail-hero__description" data-vehicle-copy>
            {vehicle.description}
          </p>
          <p className="vehicle-detail-hero__price" data-vehicle-price>
            <span>From</span>
            <strong>{priceFormatter.format(vehicle.pricePerDay)}</strong>
            <span>/ day</span>
          </p>
          <div className="vehicle-detail-hero__actions" data-vehicle-actions>
            {vehicle.available ? (
              <Link
                className="button button--primary button--md"
                href={`/booking?vehicle=${encodeURIComponent(vehicle.slug)}`}
              >
                Reserve this vehicle
                <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
            ) : (
              <span className="vehicle-detail-hero__unavailable">
                Currently unavailable
              </span>
            )}
            <span
              aria-live="polite"
              className={`vehicle-detail-hero__status${vehicle.available ? " vehicle-detail-hero__status--available" : ""}`}
            >
              <span aria-hidden="true" />
              {vehicle.available ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>

        <div
          aria-label={`${vehicle.name} ${vehicle.type} illustration`}
          className="vehicle-detail-hero__visual"
          data-vehicle-artwork
          ref={artworkRef}
          role="img"
        >
          <div aria-hidden="true" className="vehicle-detail-hero__visual-glow" />
          <Image
            alt={`${vehicle.name} ${vehicle.type}`}
            className="vehicle-detail-hero__image"
            fill
            loading="eager"
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 65vw, 60vw"
            src={imageSrc}
            unoptimized
          />
          <span className="vehicle-detail-hero__visual-caption">
            {vehicle.name}
          </span>
        </div>
      </div>
    </section>
  );
}
