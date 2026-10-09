"use client";

import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef, useState } from "react";
import { FleetFilters } from "@/components/fleet/FleetFilters";
import { VehicleCard } from "@/components/fleet/VehicleCard";
import { vehicles as seedVehicles, type FleetCategory } from "@/data/vehicles";
import { adminRepositories } from "@/lib/admin-data";
import { useAdminCollection } from "@/lib/use-admin-collection";

gsap.registerPlugin(ScrollTrigger);

const HOME_VEHICLE_LIMIT = 6;

export function FleetSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const previousCategory = useRef<FleetCategory>("all");
  const [selectedCategory, setSelectedCategory] = useState<FleetCategory>("all");
  const { items: vehicles } = useAdminCollection(
    adminRepositories.vehicles,
    seedVehicles,
  );

  const visibleVehicles = useMemo(
    () =>
      vehicles
        .filter(
          (vehicle) =>
            selectedCategory === "all" ||
            vehicle.category === selectedCategory,
        )
        .slice(0, HOME_VEHICLE_LIMIT),
    [selectedCategory, vehicles],
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    const context = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
        .fromTo(
          "[data-fleet-eyebrow]",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.55 },
        )
        .fromTo(
          "[data-fleet-heading]",
          { autoAlpha: 0, y: 28, clipPath: "inset(0 0 35% 0)" },
          {
            autoAlpha: 1,
            y: 0,
            clipPath: "inset(0 0 0% 0)",
            duration: 0.7,
          },
          "-=0.3",
        )
        .fromTo(
          "[data-fleet-intro], [data-fleet-view-all]",
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.58, stagger: 0.08 },
          "-=0.38",
        )
        .fromTo(
          "[data-fleet-filters]",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.5 },
          "-=0.28",
        )
        .fromTo(
          "[data-fleet-card]",
          { autoAlpha: 0, y: 32 },
          { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.09 },
          "-=0.22",
        );
    }, section);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (previousCategory.current === selectedCategory) return;
    previousCategory.current = selectedCategory;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    const cards = section.querySelectorAll<HTMLElement>("[data-fleet-card]");
    if (cards.length === 0) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        cards,
        { autoAlpha: 0.72, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.04,
          ease: "power3.out",
          overwrite: "auto",
          clearProps: "transform,opacity,visibility",
        },
      );
    }, section);

    return () => context.revert();
  }, [selectedCategory, visibleVehicles]);

  useEffect(() => {
    const section = sectionRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(max-width: 700px)").matches
    ) {
      return;
    }

    const imageWrappers = section.querySelectorAll<HTMLElement>(
      "[data-vehicle-image]",
    );
    if (imageWrappers.length === 0) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        imageWrappers,
        { y: -10 },
        {
          y: 10,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7,
          },
        },
      );
    }, section);

    return () => context.revert();
  }, [visibleVehicles]);

  return (
    <section
      aria-labelledby="fleet-heading"
      className="fleet-section"
      id="fleet"
      ref={sectionRef}
    >
      <div className="site-container">
        <header className="fleet-section__header">
          <div className="fleet-section__title-block">
            <p className="fleet-section__eyebrow" data-fleet-eyebrow>
              OUR FLEET
            </p>
            <h2
              className="fleet-section__heading"
              data-fleet-heading
              id="fleet-heading"
            >
              <span>Choose Your</span>
              <span>Perfect Drive.</span>
            </h2>
          </div>
          <div className="fleet-section__intro-block">
            <p className="fleet-section__intro" data-fleet-intro>
              From refined sedans to performance-focused machines, discover a
              vehicle designed for every kind of journey.
            </p>
            <Link
              className="fleet-section__view-all"
              data-fleet-view-all
              href="/fleet"
            >
              View all vehicles
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </header>

        <div data-fleet-filters>
          <FleetFilters
            onCategoryChange={setSelectedCategory}
            selectedCategory={selectedCategory}
          />
        </div>

        <p aria-live="polite" className="visually-hidden" role="status">
          {visibleVehicles.length}{" "}
          {visibleVehicles.length === 1 ? "vehicle" : "vehicles"} shown
          {selectedCategory !== "all" ? ` in ${selectedCategory}` : ""}
        </p>

        {visibleVehicles.length > 0 ? (
          <div className="fleet-grid" data-fleet-grid>
            {visibleVehicles.map((vehicle, index) => (
              <VehicleCard
                featured={vehicle.featured ?? index === 0}
                key={vehicle.id}
                vehicle={vehicle}
              />
            ))}
          </div>
        ) : (
          <div className="fleet-empty" role="status">
            <h3>No vehicles in this category yet.</h3>
            <p>Explore another category or view the full fleet.</p>
            <Link className="fleet-section__view-all" href="/fleet">
              View all vehicles
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        )}

        <div className="fleet-section__footer">
          <Link className="fleet-section__all-link" href="/fleet">
            View full fleet
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
