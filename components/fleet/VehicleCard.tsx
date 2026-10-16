"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { vehicleCategoryLabels, type Vehicle } from "@/data/vehicles";
import { formatINR } from "@/lib/currency";

interface VehicleCardProps {
  vehicle: Vehicle;
  featured: boolean;
}

export function VehicleCard({ vehicle, featured }: VehicleCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc =
    imageFailed || !vehicle.image
      ? "/images/vehicles/vehicle-photo-unavailable.svg"
      : vehicle.image;

  return (
    <article
      className={`vehicle-card${featured ? " vehicle-card--featured" : ""}`}
      data-fleet-card
    >
      <div className="vehicle-card__image-area">
        <div aria-hidden="true" className="vehicle-card__image-atmosphere" />
        <div className="vehicle-card__image-wrap" data-vehicle-image>
          <Image
            alt={
              imageSrc !== vehicle.image
                ? `Photo unavailable for ${vehicle.name}`
                : `${vehicle.name}, ${vehicle.type}`
            }
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
          <span>{vehicleCategoryLabels[vehicle.category]}</span>
        </div>

        <div className="vehicle-card__title-row">
          <div>
            <h3 className="vehicle-card__title">{vehicle.name}</h3>
            <p className="vehicle-card__type">{vehicle.type}</p>
          </div>
        </div>

        <dl className="vehicle-card__specs">
          <div>
            <dt>Seats</dt>
            <dd>{vehicle.seats}</dd>
          </div>
          <div>
            <dt>Fuel</dt>
            <dd>{vehicle.fuelType}</dd>
          </div>
        </dl>

        <div className="vehicle-card__footer">
          <p className="vehicle-card__price">
            <span>Starting at</span>
            <strong>{formatINR(vehicle.pricePerDay)}</strong>
            <span>/ day</span>
          </p>
          <Link
            className="vehicle-card__link"
            href={
              vehicle.available
                ? `/booking?vehicle=${encodeURIComponent(vehicle.id)}`
                : `/fleet/${vehicle.slug}`
            }
          >
            {vehicle.available ? "Book Now" : "View vehicle"}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
