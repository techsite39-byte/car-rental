"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useState } from "react";
import type { Vehicle } from "@/data/vehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
  featured: boolean;
}

const fallbackByCategory: Record<Vehicle["category"], string> = {
  sport: "/images/vehicles/hero-sport-placeholder.svg",
  suv: "/images/vehicles/hero-suv-placeholder.svg",
  sedan: "/images/vehicles/hero-sedan-placeholder.svg",
  electric: "/images/vehicles/hero-electric-placeholder.svg",
  convertible: "/images/vehicles/hero-sport-placeholder.svg",
};

const categoryLabels: Record<Vehicle["category"], string> = {
  sport: "Sport",
  suv: "SUV",
  sedan: "Sedan",
  electric: "Electric",
  convertible: "Convertible",
};

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function VehicleCard({ vehicle, featured }: VehicleCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc =
    imageFailed || !vehicle.imagePlaceholder
      ? fallbackByCategory[vehicle.category]
      : vehicle.imagePlaceholder;

  return (
    <article
      className={`vehicle-card${featured ? " vehicle-card--featured" : ""}`}
      data-fleet-card
    >
      <div className="vehicle-card__image-area">
        <div aria-hidden="true" className="vehicle-card__image-atmosphere" />
        <div className="vehicle-card__image-wrap" data-vehicle-image>
          <Image
            alt={`${vehicle.name}, ${vehicle.type}`}
            className="vehicle-card__image"
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            onError={() => setImageFailed(true)}
            src={imageSrc}
            unoptimized
          />
        </div>
        {featured ? (
          <span className="vehicle-card__featured">FEATURED</span>
        ) : null}
        {!vehicle.available ? (
          <span className="vehicle-card__availability">
            Currently unavailable
          </span>
        ) : null}
      </div>

      <div className="vehicle-card__body">
        <div className="vehicle-card__meta">
          <span>{vehicle.brand}</span>
          <span aria-hidden="true" className="vehicle-card__meta-divider" />
          <span>{categoryLabels[vehicle.category]}</span>
        </div>

        <div className="vehicle-card__title-row">
          <div>
            <h3 className="vehicle-card__title">{vehicle.name}</h3>
            <p className="vehicle-card__type">{vehicle.type}</p>
          </div>
          {vehicle.rating > 0 ? (
            <span
              aria-label={`Rated ${vehicle.rating} out of 5`}
              className="vehicle-card__rating"
            >
              <Star aria-hidden="true" fill="currentColor" size={14} />
              {vehicle.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <dl className="vehicle-card__specs">
          <div>
            <dt>Seats</dt>
            <dd>{vehicle.seats}</dd>
          </div>
          <div>
            <dt>Transmission</dt>
            <dd>{vehicle.transmission}</dd>
          </div>
          <div>
            <dt>Fuel</dt>
            <dd>{vehicle.fuelType}</dd>
          </div>
          <div>
            <dt>Power</dt>
            <dd>{vehicle.horsepower} hp</dd>
          </div>
        </dl>

        <div className="vehicle-card__footer">
          <p className="vehicle-card__price">
            <span>From</span>
            <strong>{priceFormatter.format(vehicle.pricePerDay)}</strong>
            <span>/ day</span>
          </p>
          <Link
            className="vehicle-card__link"
            href={`/fleet/${vehicle.slug}`}
          >
            {vehicle.available ? "Explore vehicle" : "View vehicle"}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
