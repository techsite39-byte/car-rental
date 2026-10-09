"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { Button } from "@/components/ui/Button";
import {
  DEMO_PICKUP_LOCATIONS,
  calculateEstimatedTotal,
  calculateRentalDays,
  isValidBookingDate,
  type DriverPreference,
} from "@/lib/booking";
import { vehicles as seedVehicles } from "@/data/vehicles";
import {
  adminRepositories,
  createRecordId,
} from "@/lib/admin-data";
import { useAdminCollection } from "@/lib/use-admin-collection";
import { formatINR } from "@/lib/currency";

export interface BookingContext {
  vehicle?: string;
  pickup?: string;
  returnLocation?: string;
  startDate?: string;
  endDate?: string;
  driver?: string;
  roundTrip?: string;
}

interface BookingFormProps {
  initialContext: BookingContext;
}

interface BookingErrors {
  vehicle?: string;
  pickup?: string;
  returnLocation?: string;
  startDate?: string;
  endDate?: string;
}

function isDriverPreference(value?: string): value is DriverPreference {
  return value === "self-drive" || value === "chauffeur";
}

function getLocalToday() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function BookingForm({ initialContext }: BookingFormProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const [vehicleSlug, setVehicleSlug] = useState(initialContext.vehicle ?? "");
  const [pickup, setPickup] = useState(initialContext.pickup ?? "");
  const [returnLocation, setReturnLocation] = useState(
    initialContext.returnLocation ?? "",
  );
  const [startDate, setStartDate] = useState(initialContext.startDate ?? "");
  const [endDate, setEndDate] = useState(initialContext.endDate ?? "");
  const [driver, setDriver] = useState<DriverPreference>(
    isDriverPreference(initialContext.driver)
      ? initialContext.driver
      : "self-drive",
  );
  const [roundTrip, setRoundTrip] = useState(
    initialContext.roundTrip === undefined ||
      initialContext.roundTrip === "true",
  );
  const [today, setToday] = useState("");
  const [errors, setErrors] = useState<BookingErrors>({});
  const [vehicleError, setVehicleError] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestReceived, setRequestReceived] = useState(false);
  const { items: vehicles, error: vehiclesError } = useAdminCollection(
    adminRepositories.vehicles,
    seedVehicles,
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.slug === vehicleSlug) ?? null,
    [vehicleSlug, vehicles],
  );

  const rentalDays = useMemo(
    () => calculateRentalDays(startDate, endDate),
    [startDate, endDate],
  );
  const estimatedTotal = useMemo(
    () =>
      selectedVehicle && rentalDays
        ? calculateEstimatedTotal(selectedVehicle.pricePerDay, rentalDays)
        : null,
    [rentalDays, selectedVehicle],
  );
  const conciergeHref = useMemo(() => {
    const query = new URLSearchParams({
      vehicle: selectedVehicle?.slug ?? "",
      pickup,
      return: returnLocation,
      startDate,
      endDate,
      driver,
      roundTrip: String(roundTrip),
    });
    return `/contact?${query.toString()}`;
  }, [
    driver,
    endDate,
    pickup,
    returnLocation,
    roundTrip,
    selectedVehicle,
    startDate,
  ]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-booking-group], [data-booking-summary]",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.09,
          ease: "power3.out",
        },
      );
    }, page);

    return () => context.revert();
  }, []);

  function setDateMinimum() {
    if (!today) {
      setToday(getLocalToday());
    }
  }

  function validate() {
    const nextErrors: BookingErrors = {};
    let nextVehicleError = "";

    if (!selectedVehicle) {
      nextVehicleError = vehicleSlug
        ? "That vehicle could not be found. Please choose a vehicle."
        : "Choose a vehicle to continue.";
    } else if (!selectedVehicle.available) {
      nextVehicleError = "This vehicle is currently unavailable.";
    }

    if (!pickup.trim()) nextErrors.pickup = "Choose a pick-up location.";
    if (!returnLocation.trim()) {
      nextErrors.returnLocation = "Choose a return location.";
    }
    if (!startDate || !isValidBookingDate(startDate)) {
      nextErrors.startDate = "Choose a valid pick-up date.";
    } else if (startDate < getLocalToday()) {
      nextErrors.startDate = "Pick-up date cannot be in the past.";
    }
    if (!endDate || !isValidBookingDate(endDate)) {
      nextErrors.endDate = "Choose a valid return date.";
    } else if (
      startDate &&
      isValidBookingDate(startDate) &&
      endDate < startDate
    ) {
      nextErrors.endDate = "Return date cannot be before pick-up.";
    }

    setErrors(nextErrors);
    setVehicleError(nextVehicleError);

    if (nextVehicleError) {
      fieldRefs.current.vehicle?.focus();
      return false;
    }

    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      fieldRefs.current[firstInvalidField]?.focus();
      return false;
    }

    return true;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setIsReviewing(true);
    setRequestError("");
    setRequestReceived(false);
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");
    if (!selectedVehicle) {
      setRequestError("Choose a vehicle before sending your request.");
      return;
    }
    if (vehiclesError) {
      setRequestError(vehiclesError);
      return;
    }
    try {
      adminRepositories.bookings.save({
        id: createRecordId("booking"),
        customerName: customerName.trim(),
        email: customerEmail.trim(),
        ...(customerPhone.trim() ? { phone: customerPhone.trim() } : {}),
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        vehicleSlug: selectedVehicle.slug,
        pickupLocation: pickup.trim(),
        returnLocation: returnLocation.trim(),
        pickupDate: startDate,
        returnDate: endDate,
        driverPreference: driver,
        submittedAt: new Date().toISOString(),
        status: "pending",
      });
      setRequestReceived(true);
    } catch (cause) {
      setRequestError(
        cause instanceof Error
          ? cause.message
          : "Unable to save your request in this browser.",
      );
    }
  }

  function updateField<K extends keyof BookingErrors>(
    key: K,
    updater: () => void,
  ) {
    updater();
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  return (
    <div className="booking-layout" ref={pageRef}>
      <div className="booking-layout__main">
        {isReviewing ? (
          <section
            aria-labelledby="booking-review-heading"
            className="booking-review"
            data-booking-group
          >
            <p className="booking-group__eyebrow">JOURNEY DETAILS</p>
            <h2 id="booking-review-heading">Review your journey</h2>
            <p className="booking-review__notice" role="status">
              Sending this request does not confirm a reservation. A VÉLOCE
              concierge can follow up separately.
            </p>
            <dl className="booking-review__details">
              <div>
                <dt>Vehicle</dt>
                <dd>{selectedVehicle?.name}</dd>
              </div>
              <div>
                <dt>Pick-up</dt>
                <dd>{pickup}</dd>
              </div>
              <div>
                <dt>Return</dt>
                <dd>{returnLocation}</dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>
                  {startDate} – {endDate} ({rentalDays}{" "}
                  {rentalDays === 1 ? "day" : "days"})
                </dd>
              </div>
              <div>
                <dt>Driver</dt>
                <dd>{driver === "self-drive" ? "Self drive" : "Chauffeur"}</dd>
              </div>
              <div>
                <dt>Journey</dt>
                <dd>{roundTrip ? "Round trip" : "One way"}</dd>
              </div>
              <div>
                <dt>Estimated total</dt>
                <dd>
                  {estimatedTotal === null
                    ? "Not available"
                    : formatINR(estimatedTotal)}
                </dd>
              </div>
            </dl>
            {requestReceived ? (
              <p className="booking-review__notice" role="status">
                Request received. It is not a confirmed reservation; the
                request is saved only in this browser.
              </p>
            ) : (
              <form className="booking-review__form" onSubmit={submitRequest}>
                <fieldset className="booking-group">
                  <legend className="booking-group__eyebrow">YOUR CONTACT DETAILS</legend>
                  <div className="booking-group__content booking-group__content--two">
                    <label className="booking-field" htmlFor="booking-customer-name">
                      <span>Name</span>
                      <input autoComplete="name" id="booking-customer-name" onChange={(event) => setCustomerName(event.target.value)} required value={customerName} />
                    </label>
                    <label className="booking-field" htmlFor="booking-customer-email">
                      <span>Email</span>
                      <input autoComplete="email" id="booking-customer-email" onChange={(event) => setCustomerEmail(event.target.value)} required type="email" value={customerEmail} />
                    </label>
                    <label className="booking-field" htmlFor="booking-customer-phone">
                      <span>Phone (optional)</span>
                      <input autoComplete="tel" id="booking-customer-phone" onChange={(event) => setCustomerPhone(event.target.value)} type="tel" value={customerPhone} />
                    </label>
                  </div>
                </fieldset>
                {requestError ? <p className="booking-field__error" role="alert">{requestError}</p> : null}
                <div className="booking-review__actions">
                  <Button onClick={() => setIsReviewing(false)} variant="secondary">
                    Edit journey
                  </Button>
                  <Button size="md" type="submit" variant="primary">
                    Send request
                    <span aria-hidden="true">↗</span>
                  </Button>
                </div>
              </form>
            )}
            {!requestReceived ? (
              <Link className="booking-review__concierge" href={conciergeHref}>
                Ask the concierge instead <span aria-hidden="true">↗</span>
              </Link>
            ) : null}
          </section>
        ) : (
          <form
            className="booking-form"
            noValidate
            onSubmit={handleSubmit}
          >
            <fieldset className="booking-group" data-booking-group>
              <legend className="booking-group__eyebrow">01 / VEHICLE</legend>
              <div className="booking-group__content">
                <label className="booking-field" htmlFor="booking-vehicle">
                  <span>Choose your vehicle</span>
                  <select
                    aria-describedby={vehicleError ? "booking-vehicle-error" : undefined}
                    aria-invalid={Boolean(vehicleError)}
                    id="booking-vehicle"
                    onChange={(event) => {
                      setVehicleSlug(event.target.value);
                      setVehicleError("");
                    }}
                    ref={(element) => {
                      fieldRefs.current.vehicle = element;
                    }}
                    value={vehicleSlug}
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option
                        disabled={!vehicle.available}
                        key={vehicle.id}
                        value={vehicle.slug}
                      >
                        {vehicle.name} — {vehicle.category.toUpperCase()}
                        {!vehicle.available ? " — UNAVAILABLE" : ""}
                      </option>
                    ))}
                  </select>
                  {selectedVehicle ? (
                    <span className="booking-field__hint">
                      {selectedVehicle.type} ·{" "}
                      {selectedVehicle.available
                        ? "Available"
                        : "Currently unavailable"}
                    </span>
                  ) : null}
                  {vehiclesError ? <span className="booking-field__error" role="alert">{vehiclesError}</span> : null}
                  {vehicleError ? (
                    <span
                      className="booking-field__error"
                      id="booking-vehicle-error"
                      role="alert"
                    >
                      {vehicleError}
                    </span>
                  ) : null}
                </label>
              </div>
            </fieldset>

            <fieldset className="booking-group" data-booking-group>
              <legend className="booking-group__eyebrow">02 / JOURNEY</legend>
              <div className="booking-group__content booking-group__content--two">
                <label className="booking-field" htmlFor="booking-pickup">
                  <span>Pick-up location</span>
                  <input
                    aria-describedby={errors.pickup ? "booking-pickup-error" : undefined}
                    aria-invalid={Boolean(errors.pickup)}
                    autoComplete="off"
                    id="booking-pickup"
                    list="booking-location-options"
                    onChange={(event) =>
                      updateField("pickup", () => setPickup(event.target.value))
                    }
                    ref={(element) => {
                      fieldRefs.current.pickup = element;
                    }}
                    value={pickup}
                  />
                  {errors.pickup ? (
                    <span
                      className="booking-field__error"
                      id="booking-pickup-error"
                      role="alert"
                    >
                      {errors.pickup}
                    </span>
                  ) : null}
                </label>
                <label className="booking-field" htmlFor="booking-return">
                  <span>Return location</span>
                  <input
                    aria-describedby={
                      errors.returnLocation
                        ? "booking-return-error"
                        : undefined
                    }
                    aria-invalid={Boolean(errors.returnLocation)}
                    autoComplete="off"
                    id="booking-return"
                    list="booking-location-options"
                    onChange={(event) =>
                      updateField("returnLocation", () =>
                        setReturnLocation(event.target.value),
                      )
                    }
                    ref={(element) => {
                      fieldRefs.current.returnLocation = element;
                    }}
                    value={returnLocation}
                  />
                  {errors.returnLocation ? (
                    <span
                      className="booking-field__error"
                      id="booking-return-error"
                      role="alert"
                    >
                      {errors.returnLocation}
                    </span>
                  ) : null}
                </label>
                <datalist id="booking-location-options">
                  {DEMO_PICKUP_LOCATIONS.map((location) => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
                <p className="booking-group__note">
                  Suggested demo locations only; availability is not implied.
                </p>
              </div>
            </fieldset>

            <fieldset className="booking-group" data-booking-group>
              <legend className="booking-group__eyebrow">03 / DATES</legend>
              <div className="booking-group__content booking-group__content--two">
                <label className="booking-field" htmlFor="booking-start-date">
                  <span>Pick-up date</span>
                  <input
                    aria-describedby={
                      errors.startDate ? "booking-start-error" : undefined
                    }
                    aria-invalid={Boolean(errors.startDate)}
                    id="booking-start-date"
                    min={today || undefined}
                    onChange={(event) =>
                      updateField("startDate", () =>
                        setStartDate(event.target.value),
                      )
                    }
                    onFocus={setDateMinimum}
                    ref={(element) => {
                      fieldRefs.current.startDate = element;
                    }}
                    required
                    type="date"
                    value={startDate}
                  />
                  {errors.startDate ? (
                    <span
                      className="booking-field__error"
                      id="booking-start-error"
                      role="alert"
                    >
                      {errors.startDate}
                    </span>
                  ) : null}
                </label>
                <label className="booking-field" htmlFor="booking-end-date">
                  <span>Return date</span>
                  <input
                    aria-describedby={
                      errors.endDate ? "booking-end-error" : undefined
                    }
                    aria-invalid={Boolean(errors.endDate)}
                    id="booking-end-date"
                    min={startDate || today || undefined}
                    onChange={(event) =>
                      updateField("endDate", () => setEndDate(event.target.value))
                    }
                    onFocus={setDateMinimum}
                    ref={(element) => {
                      fieldRefs.current.endDate = element;
                    }}
                    required
                    type="date"
                    value={endDate}
                  />
                  {errors.endDate ? (
                    <span
                      className="booking-field__error"
                      id="booking-end-error"
                      role="alert"
                    >
                      {errors.endDate}
                    </span>
                  ) : null}
                </label>
              </div>
            </fieldset>

            <fieldset className="booking-group" data-booking-group>
              <legend className="booking-group__eyebrow">
                04 / PREFERENCES
              </legend>
              <div className="booking-group__content">
                <fieldset className="booking-driver">
                  <legend>Driver preference</legend>
                  <label>
                    <input
                      checked={driver === "self-drive"}
                      name="booking-driver"
                      onChange={() => setDriver("self-drive")}
                      type="radio"
                    />
                    Self Drive
                  </label>
                  <label>
                    <input
                      checked={driver === "chauffeur"}
                      name="booking-driver"
                      onChange={() => setDriver("chauffeur")}
                      type="radio"
                    />
                    Chauffeur
                  </label>
                </fieldset>

                <label className="booking-round-trip">
                  <span>
                    <strong>Round trip</strong>
                    <small>Return the vehicle to the pick-up location.</small>
                  </span>
                  <input
                    checked={roundTrip}
                    onChange={(event) => setRoundTrip(event.target.checked)}
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                </label>
              </div>
            </fieldset>

            <div className="booking-form__actions">
              <Button className="booking-form__submit" size="lg" type="submit">
                Continue to reservation
                <span aria-hidden="true">↗</span>
              </Button>
              <Link
                className="button button--secondary button--md"
                href="/contact"
              >
                Speak with a concierge
              </Link>
              <p>
                Your details are used for this review only. No reservation is
                confirmed here.
              </p>
            </div>
          </form>
        )}
      </div>

      <div data-booking-summary>
        <BookingSummary
          driver={driver}
          endDate={endDate}
          estimatedTotal={estimatedTotal}
          pickup={pickup}
          rentalDays={rentalDays}
          returnLocation={returnLocation}
          roundTrip={roundTrip}
          startDate={startDate}
          vehicle={selectedVehicle}
        />
      </div>
    </div>
  );
}
