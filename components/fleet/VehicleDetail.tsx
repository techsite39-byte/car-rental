"use client";

import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { VehicleBookingCard } from "@/components/fleet/VehicleBookingCard";
import { VehicleDetailHero } from "@/components/fleet/VehicleDetailHero";
import { VehicleSpecs } from "@/components/fleet/VehicleSpecs";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  fleetVehicles as seedVehicles,
  vehicleCategoryLabels,
  type Vehicle,
} from "@/data/vehicles";
import { formatINR } from "@/lib/currency";

gsap.registerPlugin(ScrollTrigger);

interface VehicleDetailProps {
  vehicle: Vehicle;
  fleetVehicles?: Vehicle[];
}

function RelatedVehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image =
    imageFailed || !vehicle.image
      ? "/images/vehicles/vehicle-photo-unavailable.svg"
      : vehicle.image;

  return (
    <Link
      className="vehicle-related-card"
      data-detail-reveal
      href={`/fleet/${vehicle.slug}`}
    >
      <div className="vehicle-related-card__image">
        <span>{vehicleCategoryLabels[vehicle.category]}</span>
        <Image
          alt={
            image !== vehicle.image
              ? `Photo unavailable for ${vehicle.name}`
              : `${vehicle.name}, ${vehicle.type}`
          }
          fill
          loading="lazy"
          sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw"
          onError={() => setImageFailed(true)}
          src={image}
          unoptimized
        />
      </div>
      <div className="vehicle-related-card__body">
        <div>
          <p>{vehicle.brand}</p>
          <h3>{vehicle.name}</h3>
        </div>
        <span aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}

export function VehicleDetail({
  vehicle,
  fleetVehicles = seedVehicles,
}: VehicleDetailProps) {
  const pageRef = useRef<HTMLElement>(null);
  const relatedVehicles = [
    ...fleetVehicles.filter(
      (candidate) =>
        candidate.id !== vehicle.id && candidate.category === vehicle.category,
    ),
    ...fleetVehicles.filter(
      (candidate) =>
        candidate.id !== vehicle.id && candidate.category !== vehicle.category,
    ),
  ].slice(0, 3);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      page.querySelectorAll<HTMLElement>("[data-detail-reveal]").forEach((item) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            ease: "power3.out",
            clearProps: "opacity,visibility,transform",
            scrollTrigger: {
              trigger: item,
              start: "top 88%",
              once: true,
            },
          },
        );
      });
    }, page);

    return () => context.revert();
  }, [vehicle.id]);

  return (
    <main className="vehicle-detail" ref={pageRef}>
      <VehicleDetailHero vehicle={vehicle} />
      <VehicleSpecs vehicle={vehicle} />

      <section
        aria-labelledby="vehicle-experience-heading"
        className="vehicle-experience"
        data-detail-reveal
      >
        <div className="site-container vehicle-experience__inner">
          <div>
            <p className="vehicle-detail__eyebrow">THE EXPERIENCE</p>
            <h2 id="vehicle-experience-heading">
              Engineered for
              <br />
              the road ahead.
            </h2>
          </div>
          <div className="vehicle-experience__copy">
            <p>{vehicle.description}</p>
            <dl>
              <div>
                <dt>Category</dt>
                <dd>{vehicleCategoryLabels[vehicle.category]}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{vehicle.type}</dd>
              </div>
              <div>
                <dt>Availability</dt>
                <dd>
                  {vehicle.available
                    ? "Available"
                    : "Currently unavailable"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="vehicle-performance-heading"
        className="vehicle-performance"
        data-detail-reveal
      >
        <div className="site-container vehicle-performance__inner">
          <p className="vehicle-detail__eyebrow">VEHICLE DETAILS</p>
          <GlassCard className="vehicle-performance__panel">
            <h2 id="vehicle-performance-heading">{vehicle.name}</h2>
            <div className="vehicle-performance__metrics">
              <div>
                <span>SEATS</span>
                <strong>{vehicle.seats}</strong>
              </div>
              <div>
                <span>FUEL</span>
                <strong>{vehicle.fuelType}</strong>
              </div>
              <div>
                <span>STARTING PRICE / DAY</span>
                <strong>{formatINR(vehicle.pricePerDay)}</strong>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <section
        aria-label="Vehicle booking"
        className="vehicle-booking"
        data-detail-reveal
      >
        <div className="site-container vehicle-booking__inner">
          <div className="vehicle-booking__intro">
            <p className="vehicle-detail__eyebrow">MAKE IT YOURS</p>
            <h2>Your next journey starts here.</h2>
            <p>
              Choose your dates and preferences to continue to your reservation.
            </p>
          </div>
          <VehicleBookingCard vehicle={vehicle} />
        </div>
      </section>

      {relatedVehicles.length > 0 ? (
        <section
          aria-labelledby="related-vehicles-heading"
          className="vehicle-related"
        >
          <div className="site-container">
            <div className="vehicle-related__header" data-detail-reveal>
              <div>
                <p className="vehicle-detail__eyebrow">CONTINUE EXPLORING</p>
                <h2 id="related-vehicles-heading">Explore More Vehicles</h2>
              </div>
              <p>Find another vehicle for your next journey.</p>
            </div>
            <div className="vehicle-related__grid">
              {relatedVehicles.map((related) => (
                <RelatedVehicleCard key={related.id} vehicle={related} />
              ))}
            </div>
            <Link className="vehicle-related__all" href="/fleet">
              Back to the full fleet <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
