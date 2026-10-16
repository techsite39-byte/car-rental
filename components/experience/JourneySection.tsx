"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { ExperienceCard } from "@/components/experience/ExperienceCard";
import { vehicles, type Vehicle } from "@/data/vehicles";

gsap.registerPlugin(ScrollTrigger);

const journeyImages = {
  feature: "/carsimg/kiaklavis.png",
  convertible: "/carsimg/renaultkiger.png",
  fleet: {
    "kia-clavis": "/carsimg/kiaklavis.png",
    "maruti-ertiga": "/carsimg/suzukietiga.png",
    "maruti-brezza": "/carsimg/suzukibreza.png",
    "renault-kiger": "/carsimg/renaultkiger.png",
    "maruti-dzire": "/carsimg/suzukidzire.png",
    "maruti-celerio": "/carsimg/suzukicelerio.png",
  },
} as const;

function getVehicle(id: string): Vehicle {
  const vehicle = vehicles.find((candidate) => candidate.id === id);
  if (!vehicle) {
    throw new Error(`Journey section references missing vehicle "${id}".`);
  }

  return vehicle;
}

const featuredVehicle = getVehicle("kia-clavis");
const convertible = getVehicle("renault-kiger");
const fleetVehicles = vehicles;
const fleetCount = vehicles.length;

export function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const context = gsap.context(() => {
      const countElement = section.querySelector<HTMLElement>(
        "[data-journey-count]",
      );

      if (prefersReducedMotion) {
        if (countElement) {
          countElement.textContent = fleetCount.toLocaleString("en-IN");
        }
        return;
      }

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
          defaults: { ease: "power3.out" },
          onComplete: () => {
            gsap.set(section.querySelectorAll(".journey-card"), {
              clearProps: "transform",
            });
          },
        })
        .fromTo(
          "[data-journey-heading]",
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.64 },
        )
        .fromTo(
          '[data-journey-card="feature"]',
          { autoAlpha: 0, y: 30, clipPath: "inset(5% 0 0)" },
          {
            autoAlpha: 1,
            y: 0,
            clipPath: "inset(0% 0 0)",
            duration: 0.7,
          },
          "-=0.22",
        )
        .fromTo(
          '[data-journey-card="convertible"]',
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.54 },
          "-=0.28",
        )
        .fromTo(
          '[data-journey-card="fleet"]',
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.54 },
          "-=0.26",
        );

      gsap.fromTo(
        section.querySelectorAll(".journey-card__image-motion"),
        { scale: 1.04 },
        {
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          overwrite: "auto",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
        },
      );

      const parallax = section.querySelector(
        '[data-journey-card="feature"] [data-journey-parallax]',
      );
      if (parallax) {
        gsap.fromTo(
          parallax,
          { y: -8 },
          {
            y: 8,
            ease: "none",
            overwrite: "auto",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.7,
            },
          },
        );
      }

      if (countElement) {
        const count = { value: 0 };
        countElement.textContent = "0";

        gsap.to(count, {
          value: fleetCount,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: countElement,
            start: "top 88%",
            once: true,
          },
          onUpdate: () => {
            countElement.textContent = Math.round(count.value).toLocaleString(
              "en-IN",
            );
          },
          onComplete: () => {
            countElement.textContent = fleetCount.toLocaleString("en-IN");
          },
        });
      }
    }, section);

    return () => context.revert();
  }, []);

  return (
    <section
      aria-labelledby="journey-heading"
      className="journey-section"
      ref={sectionRef}
    >
      <div className="site-container">
        <header className="journey-section__header" data-journey-heading>
          <h2 className="journey-section__heading" id="journey-heading">
            More Than A Ride.
          </h2>
          <p className="journey-section__intro">
            Every vehicle is prepared for
            <br />
            the road ahead.
          </p>
        </header>

        <div className="journey-section__grid">
          <ExperienceCard
            futureImage={journeyImages.feature}
            imageSrc={journeyImages.feature}
            vehicle={featuredVehicle}
            variant="feature"
          />
          <div className="journey-section__aside">
            <ExperienceCard
              futureImage={journeyImages.convertible}
              imageSrc={journeyImages.convertible}
              vehicle={convertible}
              variant="convertible"
            />
            <ExperienceCard
              fleetVehicles={fleetVehicles}
              fleetImageSources={journeyImages.fleet}
              futureImage={journeyImages.fleet["kia-clavis"]}
              vehicle={featuredVehicle}
              vehicleCount={fleetCount}
              variant="fleet"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
