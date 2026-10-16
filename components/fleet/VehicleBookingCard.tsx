"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Vehicle } from "@/data/vehicles";
import { formatINR } from "@/lib/currency";

interface VehicleBookingCardProps {
  vehicle: Vehicle;
}

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function VehicleBookingCard({ vehicle }: VehicleBookingCardProps) {
  const router = useRouter();
  const [today, setToday] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [driverPreference, setDriverPreference] = useState<
    "self-drive" | "chauffeur"
  >("self-drive");
  const [roundTrip, setRoundTrip] = useState(true);
  const [dateError, setDateError] = useState("");

  const minimumEndDate = useMemo(() => {
    if (!startDate) return today;
    const [year, month, day] = startDate.split("-").map(Number);
    return localDateValue(new Date(year, month - 1, day + 1));
  }, [startDate, today]);

  function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDateError("");

    if (startDate && endDate && endDate <= startDate) {
      setDateError("Return date must be after the pick-up date.");
      return;
    }

    const query = new URLSearchParams({
      vehicle: vehicle.slug,
      pickup: pickupLocation.trim(),
      return: returnLocation.trim(),
      startDate,
      endDate,
      driver: driverPreference,
      roundTrip: String(roundTrip),
    });

    router.push(`/booking?${query.toString()}`);
  }

  return (
    <GlassCard
      as="article"
      className="vehicle-booking-card"
      data-detail-reveal
    >
      <div className="vehicle-booking-card__heading">
        <div>
          <p className="vehicle-detail__eyebrow">YOUR RESERVATION</p>
          <h3>{vehicle.name}</h3>
        </div>
        <p className="vehicle-booking-card__price">
          <strong>{formatINR(vehicle.pricePerDay)}</strong>
          <span>/ day</span>
        </p>
      </div>

      {vehicle.available ? (
        <form className="vehicle-booking-card__form" onSubmit={submitBooking}>
          <label className="vehicle-booking-card__field">
            <span>Pick-up location</span>
            <input
              autoComplete="address-level2"
              onChange={(event) => setPickupLocation(event.target.value)}
              placeholder="City or location"
              required
              value={pickupLocation}
            />
          </label>

          <label className="vehicle-booking-card__field">
            <span>Return location</span>
            <input
              autoComplete="shipping address-level2"
              onChange={(event) => setReturnLocation(event.target.value)}
              placeholder="City or location"
              required
              value={returnLocation}
            />
          </label>

          <div className="vehicle-booking-card__dates">
            <label className="vehicle-booking-card__field">
              <span>Start date</span>
              <input
                onFocus={() => setToday(localDateValue(new Date()))}
                min={today}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  if (endDate && event.target.value >= endDate) {
                    setEndDate("");
                  }
                  setDateError("");
                }}
                required
                type="date"
                value={startDate}
              />
            </label>
            <label className="vehicle-booking-card__field">
              <span>End date</span>
              <input
                onFocus={() => setToday(localDateValue(new Date()))}
                min={minimumEndDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setDateError("");
                }}
                required
                type="date"
                value={endDate}
              />
            </label>
          </div>

          <fieldset className="vehicle-booking-card__choice">
            <legend>Driver preference</legend>
            <label>
              <input
                checked={driverPreference === "self-drive"}
                name="driver-preference"
                onChange={() => setDriverPreference("self-drive")}
                type="radio"
              />
              Self drive
            </label>
            <label>
              <input
                checked={driverPreference === "chauffeur"}
                name="driver-preference"
                onChange={() => setDriverPreference("chauffeur")}
                type="radio"
              />
              Chauffeur
            </label>
          </fieldset>

          <label className="vehicle-booking-card__round-trip">
            <span>Round trip</span>
            <input
              checked={roundTrip}
              onChange={(event) => setRoundTrip(event.target.checked)}
              type="checkbox"
            />
            <span aria-hidden="true" />
          </label>

          {dateError ? (
            <p className="vehicle-booking-card__error" role="alert">
              {dateError}
            </p>
          ) : null}

          <button className="vehicle-booking-card__submit" type="submit">
            Book Now
            <span aria-hidden="true">↗</span>
          </button>
          <p className="vehicle-booking-card__note">
            Your details will be carried to the booking page. No reservation is
            confirmed here.
          </p>
        </form>
      ) : (
        <div className="vehicle-booking-card__unavailable" role="status">
          <p>Currently unavailable</p>
          <p>
            Contact our concierge for availability details for this vehicle.
          </p>
          <Link href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer">
            Contact us <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
