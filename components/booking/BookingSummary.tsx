import Image from "next/image";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
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

function displayValue(value: string) {
  return value.trim() || "To be selected";
}

export function BookingSummary({
  vehicle,
  pickup,
  returnLocation,
  startDate,
  startTime,
  endDate,
  endTime,
  driver,
  roundTrip,
  rentalDays,
  estimatedTotal,
}: BookingSummaryProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const vehicleImage = vehicle?.image ?? null;
  const fallbackImage = vehicle ? "/images/vehicles/vehicle-photo-unavailable.svg" : null;
  const artwork =
    vehicleImage && failedImage !== vehicleImage
      ? vehicleImage
      : fallbackImage && failedImage !== fallbackImage
        ? fallbackImage
        : null;

  return (
    <GlassCard
      as="section"
      aria-label="Booking estimate"
      className="booking-summary"
    >
      <p className="booking-summary__eyebrow">YOUR JOURNEY</p>
      <div className="booking-summary__artwork">
        {artwork ? (
          <Image
            alt={
              artwork === fallbackImage
                ? `Photo unavailable for ${vehicle?.name ?? "selected vehicle"}`
                : `${vehicle?.name ?? "Selected vehicle"}, ${vehicle?.type ?? "car"}`
            }
            className="booking-summary__image"
            fill
            onError={() => setFailedImage(artwork)}
            sizes="(max-width: 900px) 100vw, 40vw"
            src={artwork}
            unoptimized
          />
        ) : vehicle ? (
          <span className="booking-summary__image-fallback">
            Vehicle photo unavailable
          </span>
        ) : null}
      </div>
      <div className="booking-summary__vehicle">
        <div>
          <h2>{vehicle?.name ?? "Choose a vehicle"}</h2>
          <p>
            {vehicle
              ? `${vehicle.seats} seats · ${vehicle.fuelType} · ${vehicle.type}`
              : "Your selected vehicle will appear here."}
          </p>
        </div>
        {vehicle ? (
          <span
            className={`booking-summary__availability${vehicle.available ? "" : " booking-summary__availability--unavailable"}`}
          >
            {vehicle.available ? "Available" : "Unavailable"}
          </span>
        ) : null}
      </div>

      <dl className="booking-summary__details">
        <div>
          <dt>Starting price per day</dt>
          <dd>
            {vehicle ? formatINR(vehicle.pricePerDay) : "—"}
          </dd>
        </div>
        <div>
          <dt>Pick-up</dt>
          <dd>{displayValue(pickup)}</dd>
        </div>
        <div>
          <dt>Return</dt>
          <dd>{displayValue(returnLocation)}</dd>
        </div>
        <div>
          <dt>Pick-up time</dt>
          <dd>{startDate ? `${startDate} · ${startTime}` : "Choose a date and time"}</dd>
        </div>
        <div>
          <dt>Return time</dt>
          <dd>{endDate ? `${endDate} · ${endTime}` : "Choose a date and time"}</dd>
        </div>
        <div>
          <dt>Driver</dt>
          <dd>{driver === "self-drive" ? "Self Drive" : "Chauffeur"}</dd>
        </div>
        <div>
          <dt>Journey</dt>
          <dd>{roundTrip ? "Round trip" : "One way"}</dd>
        </div>
      </dl>

      <div aria-live="polite" className="booking-summary__total">
        <div>
          <span>ESTIMATED TOTAL</span>
          <small>
            {rentalDays
              ? `${rentalDays} ${rentalDays === 1 ? "day" : "days"}`
              : "Rental estimate"}
          </small>
        </div>
        <strong>
          {estimatedTotal === null
            ? "—"
            : formatINR(estimatedTotal)}
        </strong>
      </div>
      <p className="booking-summary__note">
        Estimate only; listed prices and specifications follow the supplied
        fleet information. Confirm the exact variant and final terms with
        EPICDRIVE. Taxes and other charges are not included.
      </p>
    </GlassCard>
  );
}
