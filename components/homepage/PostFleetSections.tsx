"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { vehicles, type FleetCategory, type Vehicle } from "@/data/vehicles";

gsap.registerPlugin(ScrollTrigger);

interface DrivingExperience {
  category: FleetCategory;
  title: string;
  description: string;
  action: string;
  image: Vehicle;
  imageAlt: string;
}

function getVehicle(category: FleetCategory): Vehicle {
  const vehicle = vehicles.find((candidate) => candidate.category === category);
  if (!vehicle) {
    throw new Error(`Driving experience has no vehicle for "${category}".`);
  }
  return vehicle;
}

const experiences: DrivingExperience[] = [
  {
    category: "sport",
    title: "SPORTS & PERFORMANCE",
    description: "Made for the moments that move you.",
    action: "Explore Sports Cars",
    image: getVehicle("sport"),
    imageAlt: "Sports car photographed in a cinematic automotive setting",
  },
  {
    category: "sedan",
    title: "LUXURY & EXECUTIVE",
    description: "Arrive with understated elegance.",
    action: "Explore Luxury Cars",
    image: getVehicle("sedan"),
    imageAlt: "Executive luxury sedan in a premium setting",
  },
  {
    category: "suv",
    title: "PREMIUM SUVs",
    description: "Room for every road ahead.",
    action: "Explore SUVs",
    image: {
      ...getVehicle("suv"),
      image: "/images/vehicles/hero-luxury-suv.jpg",
    },
    imageAlt: "Premium SUV ready for the open road",
  },
  {
    category: "electric",
    title: "ELECTRIC & FUTURE",
    description: "A new way to experience the drive.",
    action: "Explore Electric",
    image: getVehicle("electric"),
    imageAlt: "Premium electric vehicle in an editorial setting",
  },
];

const occasionCards = [
  {
    category: "sedan" as const,
    eyebrow: "BUSINESS & EXECUTIVE",
    heading: "Make every arrival count.",
    description: "A refined choice for meetings and professional journeys.",
    action: "Find Your Vehicle",
    image: getVehicle("sedan"),
    imageAlt: "Executive sedan for professional journeys",
  },
  {
    category: "sport" as const,
    eyebrow: "WEEKEND ESCAPES",
    heading: "Take the scenic route.",
    description:
      "Find a car that makes the journey part of the adventure.",
    action: "Explore the Fleet",
    image: {
      ...getVehicle("sport"),
      image: "/images/vehicles/hero-porsche-taycan.jpg",
    },
    imageAlt: "Performance car ready for a weekend drive",
  },
  {
    category: "convertible" as const,
    eyebrow: "SPECIAL MOMENTS",
    heading: "Give every moment a grand entrance.",
    description:
      "Explore vehicles for celebrations and memorable occasions.",
    action: "Discover Your Options",
    image: getVehicle("convertible"),
    imageAlt: "Elegant convertible for a memorable occasion",
  },
];

function getFallbackImage(src: string): string {
  return (
    vehicles.find((vehicle) => vehicle.image !== src)?.image ?? vehicles[0].image
  );
}

function EditorialImage({
  alt,
  fallback,
  sizes,
  src,
}: {
  alt: string;
  fallback: string;
  sizes: string;
  src: string;
}) {
  const [imageSrc, setImageSrc] = useState(src);
  const failedSrc = useRef<string | null>(null);

  return (
    <Image
      alt={alt}
      className="post-fleet-image"
      fill
      onError={() => {
        if (failedSrc.current !== imageSrc && imageSrc !== fallback) {
          failedSrc.current = imageSrc;
          setImageSrc(fallback);
        }
      }}
      sizes={sizes}
      src={imageSrc}
    />
  );
}

export function PostFleetSections() {
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = sectionsRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      root.querySelectorAll<HTMLElement>("[data-post-fleet-section]").forEach(
        (section) => {
          gsap.fromTo(
            section.querySelectorAll<HTMLElement>("[data-post-fleet-reveal]"),
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.68,
              stagger: 0.09,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section,
                start: "top 82%",
                once: true,
              },
            },
          );

          gsap.fromTo(
            section.querySelectorAll<HTMLElement>("[data-post-fleet-image-motion]"),
            { scale: 1.045 },
            {
              scale: 1,
              duration: 1.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section,
                start: "top 82%",
                once: true,
              },
            },
          );
        },
      );
    }, root);

    return () => context.revert();
  }, []);

  const journeyVehicle = {
    ...getVehicle("suv"),
    image: "/images/vehicles/hero-luxury-suv.jpg",
  };

  return (
    <div className="post-fleet-sections" ref={sectionsRef}>
      <section
        aria-labelledby="driving-experience-heading"
        className="driving-experience"
        data-post-fleet-section
      >
        <div className="site-container">
          <header className="post-fleet-header" data-post-fleet-reveal>
            <h2 id="driving-experience-heading">FIND YOUR DRIVING EXPERIENCE</h2>
            <p className="post-fleet-intro">
              From thrilling weekend escapes to effortless everyday luxury,
              find the perfect vehicle for every journey.
            </p>
          </header>
          <div className="driving-experience__grid">
            {experiences.map((experience, index) => (
              <Link
                aria-label={`${experience.action}: ${experience.title}`}
                className="driving-experience-card"
                data-post-fleet-reveal
                href={`/fleet?category=${experience.category}`}
                key={experience.category}
              >
                <div className="driving-experience-card__media">
                  <div
                    className="post-fleet-image-motion"
                    data-post-fleet-image-motion
                  >
                    <EditorialImage
                      alt={experience.imageAlt}
                      fallback={getFallbackImage(experience.image.image)}
                      sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 25vw"
                      src={experience.image.image}
                    />
                  </div>
                  <span className="driving-experience-card__index">
                    0{index + 1}
                  </span>
                  <div className="driving-experience-card__content">
                    <p className="driving-experience-card__eyebrow">
                      {experience.title}
                    </p>
                    <h3>{experience.description}</h3>
                    <span className="post-fleet-card-action">
                      {experience.action}
                      <ArrowUpRight aria-hidden="true" size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="journey-rules-heading"
        className="journey-rules"
        data-post-fleet-section
      >
        <div className="site-container journey-rules__layout">
          <div
            aria-label="Premium vehicle for a comfortable journey"
            className="journey-rules__visual"
            data-post-fleet-reveal
          >
            <div
              className="journey-rules__image-motion post-fleet-image-motion"
              data-post-fleet-image-motion
            >
              <EditorialImage
                alt="Premium SUV photographed for a considered road journey"
                fallback={getFallbackImage(journeyVehicle.image)}
                sizes="(max-width: 700px) 90vw, 52vw"
                src={journeyVehicle.image}
              />
            </div>
            <span aria-hidden="true" className="journey-rules__image-label">
              VÉLOCE / YOUR NEXT JOURNEY
            </span>
          </div>
          <div className="journey-rules__content" data-post-fleet-reveal>
            <p className="post-fleet-eyebrow">THE VÉLOCE EXPERIENCE</p>
            <h2 id="journey-rules-heading">
              More than a car. A better way to travel.
            </h2>
            <p className="journey-rules__description">
              Whether it’s a business meeting, a weekend escape, or a special
              occasion, experience every journey with comfort, confidence, and
              complete freedom.
            </p>
            <ul className="journey-rules__features">
              <li>
                <span aria-hidden="true">01</span>
                <div>
                  <h3>Premium Selection</h3>
                  <p>Vehicles selected for comfort, performance, and style.</p>
                </div>
              </li>
              <li>
                <span aria-hidden="true">02</span>
                <div>
                  <h3>Flexible Journeys</h3>
                  <p>Find a vehicle that fits your plans.</p>
                </div>
              </li>
              <li>
                <span aria-hidden="true">03</span>
                <div>
                  <h3>Effortless Booking</h3>
                  <p>Explore available options and reserve with ease.</p>
                </div>
              </li>
            </ul>
            <Button href="/fleet" size="lg" variant="primary">
              Explore Our Fleet
              <ArrowUpRight aria-hidden="true" size={17} />
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="occasion-heading"
        className="occasion-section"
        data-post-fleet-section
      >
        <div className="site-container">
          <header
            className="post-fleet-header occasion-section__header"
            data-post-fleet-reveal
          >
            <p className="post-fleet-eyebrow">MADE FOR YOUR MOMENTS</p>
            <h2 id="occasion-heading">THE PERFECT CAR FOR EVERY OCCASION</h2>
          </header>
          <div className="occasion-section__grid">
            {occasionCards.map((card) => (
              <Link
                aria-label={`${card.action}: ${card.eyebrow}`}
                className="occasion-card"
                data-post-fleet-reveal
                href={`/fleet?category=${card.category}`}
                key={card.eyebrow}
              >
                <div className="occasion-card__media">
                  <div
                    className="post-fleet-image-motion"
                    data-post-fleet-image-motion
                  >
                    <EditorialImage
                      alt={card.imageAlt}
                      fallback={getFallbackImage(card.image.image)}
                      sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 33vw"
                      src={card.image.image}
                    />
                  </div>
                  <span className="occasion-card__eyebrow">{card.eyebrow}</span>
                </div>
                <div className="occasion-card__content">
                  <h3>{card.heading}</h3>
                  <p>{card.description}</p>
                  <span className="post-fleet-card-action">
                    {card.action}
                    <ArrowUpRight aria-hidden="true" size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
