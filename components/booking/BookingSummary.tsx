import { GlassCard } from "@/components/ui/GlassCard";
import type { DriverPreference } from "@/lib/booking";
import type { Vehicle } from "@/data/vehicles";
import { formatINR } from "@/lib/currency";

interface BookingSummaryProps {
  vehicle: Vehicle | null;
  pickup: string;
  returnLocation: string;
  startDate: string;
  endDate: string;
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
  endDate,
  driver,
  roundTrip,
  rentalDays,
  estimatedTotal,
}: BookingSummaryProps) {
  const artwork =
    vehicle?.imagePlaceholder ??
    vehicle?.heroImage ??
    "/images/vehicles/hero-sport-placeholder.svg";

  return (
    <GlassCard
      as="section"
      aria-label="Booking estimate"
      className="booking-summary"
    >
      <p className="booking-summary__eyebrow">YOUR JOURNEY</p>
      <div
        aria-label={vehicle ? `${vehicle.name} vehicle artwork` : "Vehicle artwork"}
        className="booking-summary__artwork"
        role="img"
        style={{ backgroundImage: `url("${artwork}")` }}
      />
      <div className="booking-summary__vehicle">
        <div>
          <h2>{vehicle?.name ?? "Choose a vehicle"}</h2>
          <p>{vehicle?.type ?? "Your selected vehicle will appear here."}</p>
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
          <dt>Price per day</dt>
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
          <dt>Dates</dt>
          <dd>
            {startDate && endDate
              ? `${startDate} — ${endDate}`
              : "Choose your dates"}
          </dd>
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
        Final pricing may vary based on the confirmed booking.
      </p>
    </GlassCard>
  );
}
