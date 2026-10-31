import Image from "next/image";
import { Fuel, Gauge, UsersRound } from "lucide-react";
import { useState } from "react";
import type { DriverPreference } from "@/lib/booking";
import type { Vehicle } from "@/data/vehicles";
import { formatINR } from "@/lib/currency";

interface BookingSummaryProps {
  vehicle: Vehicle | null;
  pickup: string;
  returnLocation: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  driver: DriverPreference;
  roundTrip: boolean;
  rentalDays: number | null;
  estimatedTotal: number | null;
}

function dateLabel(value: string) {
  if (!value) return "Select date";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
      }).format(date);
}

export function BookingSummary({
  vehicle,
  pickup,
  returnLocation,
  startDate,
  startTime,
  endDate,
  endTime,
  rentalDays,
  estimatedTotal,
}: Omit<BookingSummaryProps, "driver" | "roundTrip">) {
  const [failedImage, setFailedImage] = useState(false);
  const image = failedImage
    ? "/images/vehicles/vehicle-photo-unavailable.svg"
    : vehicle?.image;

  return (
    <section aria-label="Trip overview" className="booking-summary">
      <div className="booking-summary__vehicle-panel">
        <div className="booking-summary__vehicle-copy">
          <p className="booking-page__eyebrow">CONFIRM YOUR TRIP</p>
          <h2>{vehicle?.name ?? "Choose a vehicle"}</h2>
          <div className="booking-summary__tags">
            <span className="tag--red">{vehicle?.type || "Premium"}</span>
            <span>{pickup || "Location"} - {returnLocation || "Location"}</span>
            <span>{rentalDays ? `${rentalDays} Day Trip` : "—"}</span>
          </div>
          
          <div className="booking-summary__date-grid">
            <div className="date-card">
              <span>PICKUP</span>
              <strong>{dateLabel(startDate)}, {startTime}</strong>
            </div>
            <div className="date-card">
              <span>RETURN</span>
              <strong>{dateLabel(endDate)}, {endTime}</strong>
            </div>
          </div>
        </div>

        <div className="booking-summary__vehicle-image-card">
          {image && (
            <div className="vehicle-image-wrapper">
              <Image
                alt={vehicle ? `${vehicle.name}, ${vehicle.type}` : "Selected vehicle"}
                className="booking-summary__image"
                height={200}
                onError={() => setFailedImage(true)}
                src={image}
                unoptimized
                width={400}
              />
            </div>
          )}
          
          <div className="booking-summary__price">
            {vehicle ? formatINR(vehicle.pricePerDay * (rentalDays || 1)) : "—"}
          </div>
        </div>
      </div>
      <div className="booking-summary__hidden-total" aria-live="polite" style={{ display: 'none' }}>
        Estimated total: {estimatedTotal === null ? "To be calculated" : formatINR(estimatedTotal)}
      </div>
    </section>
  );
}
