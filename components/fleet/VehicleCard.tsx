"use client";

import Image from "next/image";
import Link from "next/link";
import { Fuel, Settings2, UsersRound } from "lucide-react";
import { useState } from "react";
import { vehicleCategoryLabels, type Vehicle } from "@/data/vehicles";
import { formatINR } from "@/lib/currency";
import { getLocalVehicleImage } from "@/lib/vehicle-images";

interface VehicleCardProps {
  vehicle: Vehicle;
  featured: boolean;
}

export function VehicleCard({ vehicle, featured }: VehicleCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const mappedImage = getLocalVehicleImage(vehicle);
  const imageSrc =
    imageFailed || !mappedImage
      ? "/images/vehicles/vehicle-photo-unavailable.svg"
      : mappedImage;
  const hasDiscount =
    Number.isFinite(vehicle.discount) &&
    Number.isFinite(vehicle.originalPricePerDay) &&
    (vehicle.originalPricePerDay ?? 0) > vehicle.pricePerDay;
  const savings = hasDiscount
    ? (vehicle.originalPricePerDay ?? 0) - vehicle.pricePerDay
    : 0;

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
              imageSrc !== mappedImage
                ? `Photo unavailable for ${vehicle.name}`
                : `${vehicle.name}, ${vehicle.type}`
            }
            className="vehicle-card__image"
            fill
            loading="lazy"
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            onError={() => setImageFailed(true)}
            src={imageSrc}
            unoptimized={!imageSrc.startsWith("/")}
          />
        </div>
        {hasDiscount ? (
          <span className="vehicle-card__save">Save {formatINR(savings)}</span>
        ) : featured ? (
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
          <div className="vehicle-card__spec">
            <dt><UsersRound aria-hidden="true" size={13} /> Seats</dt>
            <dd>{vehicle.seats} Seater</dd>
          </div>
          <div className="vehicle-card__spec">
            <dt><Fuel aria-hidden="true" size={13} /> Fuel</dt>
            <dd>{vehicle.fuelType}</dd>
          </div>
          <div className="vehicle-card__spec">
            <dt><Settings2 aria-hidden="true" size={13} /> Transmission</dt>
            <dd>{vehicle.transmission ?? "Not listed"}</dd>
          </div>
        </dl>

        <div className="vehicle-card__footer">
          <p className="vehicle-card__price">
            <span>Starting at</span>
            <strong>{formatINR(vehicle.pricePerDay)}</strong>
            <span>/ day</span>
            {hasDiscount ? (
              <del>{formatINR(vehicle.originalPricePerDay ?? 0)}</del>
            ) : null}
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
