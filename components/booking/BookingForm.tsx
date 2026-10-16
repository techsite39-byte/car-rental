"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { gsap } from "gsap";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { Button } from "@/components/ui/Button";
import { bookingVehicles } from "@/data/vehicles";
import {
  DEMO_PICKUP_LOCATIONS,
  isValidBookingDate,
  type DriverPreference,
} from "@/lib/booking";
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

type BookingField =
  | "vehicle"
  | "pickup"
  | "returnLocation"
  | "startDate"
  | "startTime"
  | "endDate"
  | "endTime"
  | "customerName"
  | "customerPhone"
  | "customerEmail";

type BookingErrors = Partial<Record<BookingField, string>>;

interface SavedBooking {
  bookingReference: string;
  vehicleName: string;
  pickupDateTime: string;
  returnDateTime: string;
  estimatedTotal: number;
}

interface BookingApiResponse {
  booking?: SavedBooking;
  error?: string;
  code?: string;
}

type BookingInput = HTMLInputElement | HTMLSelectElement;

function localToday() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDriverPreference(value?: string): DriverPreference {
  return value === "chauffeur" || value === "with"
    ? "chauffeur"
    : "self-drive";
}

function toLocalDateTime(date: string, time: string) {
  if (!isValidBookingDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }
  const value = new Date(`${date}T${time}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BookingForm({ initialContext }: BookingFormProps) {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLElement>(null);
  const fieldRefs = useRef<Partial<Record<BookingField, BookingInput | null>>>(
    {},
  );
  const idempotencyRequest = useRef<{
    body: string;
    key: string;
  } | null>(null);
  const [vehicleIdentifier, setVehicleIdentifier] = useState(() => {
    const initialVehicle = bookingVehicles.find(
      (vehicle) =>
        vehicle.id === initialContext.vehicle ||
        vehicle.slug === initialContext.vehicle,
    );
    return initialVehicle?.id ?? initialContext.vehicle ?? "";
  });
  const [pickup, setPickup] = useState(initialContext.pickup ?? "");
  const [returnLocation, setReturnLocation] = useState(
    initialContext.returnLocation ?? "",
  );
  const [startDate, setStartDate] = useState(initialContext.startDate ?? "");
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState(initialContext.endDate ?? "");
  const [endTime, setEndTime] = useState("10:00");
  const [driver, setDriver] = useState<DriverPreference>(
    getDriverPreference(initialContext.driver),
  );
  const [roundTrip, setRoundTrip] = useState(
    initialContext.roundTrip === undefined ||
      initialContext.roundTrip === "true",
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [additionalRequests, setAdditionalRequests] = useState("");
  const [errors, setErrors] = useState<BookingErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] =
    useState<SavedBooking | null>(null);
  const [today, setToday] = useState("");

  const selectedVehicle = useMemo(
    () =>
      bookingVehicles.find(
        (vehicle) =>
          vehicle.id === vehicleIdentifier ||
          vehicle.slug === vehicleIdentifier,
      ) ?? null,
    [vehicleIdentifier],
  );

  const pickupDateTime = useMemo(
    () => toLocalDateTime(startDate, startTime),
    [startDate, startTime],
  );
  const returnDateTime = useMemo(
    () => toLocalDateTime(endDate, endTime),
    [endDate, endTime],
  );
  const rentalDays = useMemo(() => {
    if (!pickupDateTime || !returnDateTime || returnDateTime <= pickupDateTime) {
      return null;
    }
    return Math.ceil(
      (returnDateTime.getTime() - pickupDateTime.getTime()) / 86_400_000,
    );
  }, [pickupDateTime, returnDateTime]);
  const estimatedTotal =
    selectedVehicle && rentalDays
      ? selectedVehicle.pricePerDay * rentalDays
      : null;

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

  useEffect(() => {
    if (!confirmation) return;
    confirmationRef.current?.focus();
  }, [confirmation]);

  function showValidationErrors(nextErrors: BookingErrors) {
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0] as BookingField | undefined;
    if (firstInvalid) fieldRefs.current[firstInvalid]?.focus();
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");

    const nextErrors: BookingErrors = {};
    if (!selectedVehicle) {
      nextErrors.vehicle = "Choose a vehicle from the fleet.";
    } else if (!selectedVehicle.available) {
      nextErrors.vehicle = "This vehicle is currently unavailable.";
    }
    if (!pickup.trim() || pickup.trim().length > 120) {
      nextErrors.pickup = "Enter a pick-up location (up to 120 characters).";
    }
    if (!returnLocation.trim() || returnLocation.trim().length > 120) {
      nextErrors.returnLocation = "Enter a return location (up to 120 characters).";
    }
    if (!isValidBookingDate(startDate) || startDate < localToday()) {
      nextErrors.startDate = "Choose a valid pick-up date that is not in the past.";
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      nextErrors.startTime = "Choose a valid pick-up time.";
    }
    if (!isValidBookingDate(endDate)) {
      nextErrors.endDate = "Choose a valid return date.";
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
      nextErrors.endTime = "Choose a valid return time.";
    }
    if (
      pickupDateTime &&
      returnDateTime &&
      returnDateTime <= pickupDateTime
    ) {
      nextErrors.endDate =
        "Return date and time must be later than pick-up.";
      nextErrors.endTime =
        "Return date and time must be later than pick-up.";
    }
    if (customerName.trim().length < 2 || customerName.trim().length > 120) {
      nextErrors.customerName = "Enter your name (2–120 characters).";
    }
    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (
      !/^\+?[0-9\s().-]+$/.test(customerPhone.trim()) ||
      phoneDigits.length < 7 ||
      phoneDigits.length > 15
    ) {
      nextErrors.customerPhone = "Enter a valid phone number.";
    }
    if (
      customerEmail.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
    ) {
      nextErrors.customerEmail = "Enter a valid email address.";
    }

    showValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedVehicle || !pickupDateTime || !returnDateTime || !rentalDays) {
      return;
    }

    setIsSubmitting(true);
    const requestBody = JSON.stringify({
      customerName: customerName.trim(),
      phone: customerPhone.trim(),
      email: customerEmail.trim(),
      vehicleId: selectedVehicle.id,
      pickupLocation: pickup.trim(),
      returnLocation: returnLocation.trim(),
      pickupDateTime: pickupDateTime.toISOString(),
      returnDateTime: returnDateTime.toISOString(),
      rentalType: driver,
      roundTrip,
      additionalRequests: additionalRequests.trim(),
    });
    let currentRequest = idempotencyRequest.current;
    if (!currentRequest || currentRequest.body !== requestBody) {
      currentRequest = {
        body: requestBody,
        key: crypto.randomUUID(),
      };
      idempotencyRequest.current = currentRequest;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": currentRequest.key,
        },
        body: requestBody,
      });

      const payload = (await response.json().catch(() => null)) as
        | BookingApiResponse
        | null;
      if (!response.ok || !payload?.booking) {
        const message =
          response.status === 503
            ? payload?.code === "database_not_configured"
              ? "Booking confirmation is unavailable because the booking database has not been configured yet. Please contact our team."
              : "The booking service is temporarily unavailable. Your request was not confirmed. Please try again shortly."
            : response.status === 429
              ? "Too many booking attempts. Please wait a moment and try again."
              : payload?.error ??
                "We could not submit your booking. Please check your details and try again.";
        setRequestError(message);
        return;
      }

      setConfirmation(payload.booking);
    } catch {
      setRequestError(
        "We could not reach the booking service. Your booking was not saved. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <section
        aria-labelledby="booking-confirmation-heading"
        className="booking-confirmation"
        data-booking-confirmation
        ref={confirmationRef}
        role="status"
        tabIndex={-1}
      >
        <span aria-hidden="true" className="booking-confirmation__icon">
          <Check size={26} strokeWidth={2.2} />
        </span>
        <p className="booking-page__eyebrow">EPICDRIVE / JOURNEY REQUEST</p>
        <h2 id="booking-confirmation-heading">Booking Request Received</h2>
        <p className="booking-confirmation__intro">
          Your booking request has been saved and is pending confirmation.
        </p>
        <dl className="booking-confirmation__details">
          <div>
            <dt>Booking reference</dt>
            <dd>{confirmation.bookingReference}</dd>
          </div>
          <div>
            <dt>Vehicle</dt>
            <dd>{confirmation.vehicleName}</dd>
          </div>
          <div>
            <dt>Pick-up</dt>
            <dd>{formatDateTime(confirmation.pickupDateTime)}</dd>
          </div>
          <div>
            <dt>Return</dt>
            <dd>{formatDateTime(confirmation.returnDateTime)}</dd>
          </div>
          <div>
            <dt>Estimated total</dt>
            <dd>{formatINR(confirmation.estimatedTotal)}</dd>
          </div>
        </dl>
        <p className="booking-confirmation__message">
          Our team will contact you shortly to confirm the final details.
        </p>
        <Button
          onClick={() => router.push("/")}
          size="lg"
          type="button"
          variant="primary"
        >
          OK
          <ArrowUpRight aria-hidden="true" size={17} />
        </Button>
      </section>
    );
  }

  return (
    <div className="booking-layout" ref={pageRef}>
      <div className="booking-layout__main">
        <form className="booking-form" noValidate onSubmit={submitBooking}>
          <fieldset className="booking-group" data-booking-group disabled={isSubmitting}>
            <legend className="booking-group__eyebrow">01 / VEHICLE</legend>
            <div className="booking-group__content">
              <label className="booking-field" htmlFor="booking-vehicle">
                <span>Choose your vehicle</span>
                <select
                  aria-invalid={Boolean(errors.vehicle)}
                  aria-describedby={errors.vehicle ? "booking-vehicle-error" : undefined}
                  id="booking-vehicle"
                  onChange={(event) => {
                    setVehicleIdentifier(event.target.value);
                    setErrors((current) => ({ ...current, vehicle: undefined }));
                  }}
                  ref={(element) => {
                    fieldRefs.current.vehicle = element;
                  }}
                  value={vehicleIdentifier}
                >
                  <option value="">Select a vehicle</option>
                  {bookingVehicles.map((vehicle) => (
                    <option
                      disabled={!vehicle.available}
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.name} — {vehicle.seats} seats, {vehicle.fuelType}
                      {!vehicle.available ? " — UNAVAILABLE" : ""}
                    </option>
                  ))}
                </select>
                {selectedVehicle ? (
                  <span className="booking-field__hint">
                    {selectedVehicle.seats} seats · {selectedVehicle.fuelType} · Starting at {formatINR(selectedVehicle.pricePerDay)} / day
                  </span>
                ) : null}
                {errors.vehicle ? (
                  <span className="booking-field__error" id="booking-vehicle-error">
                    {errors.vehicle}
                  </span>
                ) : null}
              </label>
            </div>
          </fieldset>

          <fieldset className="booking-group" data-booking-group disabled={isSubmitting}>
            <legend className="booking-group__eyebrow">02 / JOURNEY</legend>
            <div className="booking-group__content booking-group__content--two">
              <label className="booking-field" htmlFor="booking-pickup">
                <span>Pick-up location</span>
                <input
                  aria-invalid={Boolean(errors.pickup)}
                  aria-describedby={errors.pickup ? "booking-pickup-error" : undefined}
                  autoComplete="address-level2"
                  id="booking-pickup"
                  list="booking-location-options"
                  onChange={(event) => setPickup(event.target.value)}
                  ref={(element) => {
                    fieldRefs.current.pickup = element;
                  }}
                  required
                  value={pickup}
                />
                {errors.pickup ? <span className="booking-field__error" id="booking-pickup-error">{errors.pickup}</span> : null}
              </label>
              <label className="booking-field" htmlFor="booking-return-location">
                <span>Return location</span>
                <input
                  aria-invalid={Boolean(errors.returnLocation)}
                  aria-describedby={errors.returnLocation ? "booking-return-location-error" : undefined}
                  autoComplete="off"
                  id="booking-return-location"
                  list="booking-location-options"
                  onChange={(event) => setReturnLocation(event.target.value)}
                  ref={(element) => {
                    fieldRefs.current.returnLocation = element;
                  }}
                  required
                  value={returnLocation}
                />
                {errors.returnLocation ? <span className="booking-field__error" id="booking-return-location-error">{errors.returnLocation}</span> : null}
              </label>
              <datalist id="booking-location-options">
                {DEMO_PICKUP_LOCATIONS.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
              <p className="booking-group__note">
                Suggested locations only; availability is confirmed by our team.
              </p>
            </div>
          </fieldset>

          <fieldset className="booking-group" data-booking-group disabled={isSubmitting}>
            <legend className="booking-group__eyebrow">03 / DATES &amp; TIMES</legend>
            <div className="booking-group__content booking-group__content--two">
              <label className="booking-field" htmlFor="booking-start-date">
                <span>Pick-up date</span>
                <input
                  aria-invalid={Boolean(errors.startDate)}
                  aria-describedby={errors.startDate ? "booking-start-date-error" : undefined}
                  id="booking-start-date"
                  min={today || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  onFocus={() => setToday(localToday())}
                  ref={(element) => {
                    fieldRefs.current.startDate = element;
                  }}
                  required
                  type="date"
                  value={startDate}
                />
                {errors.startDate ? <span className="booking-field__error" id="booking-start-date-error">{errors.startDate}</span> : null}
              </label>
              <label className="booking-field" htmlFor="booking-start-time">
                <span>Pick-up time</span>
                <input
                  aria-invalid={Boolean(errors.startTime)}
                  aria-describedby={errors.startTime ? "booking-start-time-error" : undefined}
                  id="booking-start-time"
                  onChange={(event) => setStartTime(event.target.value)}
                  ref={(element) => {
                    fieldRefs.current.startTime = element;
                  }}
                  required
                  type="time"
                  value={startTime}
                />
                {errors.startTime ? <span className="booking-field__error" id="booking-start-time-error">{errors.startTime}</span> : null}
              </label>
              <label className="booking-field" htmlFor="booking-end-date">
                <span>Return date</span>
                <input
                  aria-invalid={Boolean(errors.endDate)}
                  aria-describedby={errors.endDate ? "booking-end-date-error" : undefined}
                  id="booking-end-date"
                  min={startDate || today || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  onFocus={() => setToday(localToday())}
                  ref={(element) => {
                    fieldRefs.current.endDate = element;
                  }}
                  required
                  type="date"
                  value={endDate}
                />
                {errors.endDate ? <span className="booking-field__error" id="booking-end-date-error">{errors.endDate}</span> : null}
              </label>
              <label className="booking-field" htmlFor="booking-end-time">
                <span>Return time</span>
                <input
                  aria-invalid={Boolean(errors.endTime)}
                  aria-describedby={errors.endTime ? "booking-end-time-error" : undefined}
                  id="booking-end-time"
                  onChange={(event) => setEndTime(event.target.value)}
                  ref={(element) => {
                    fieldRefs.current.endTime = element;
                  }}
                  required
                  type="time"
                  value={endTime}
                />
                {errors.endTime ? <span className="booking-field__error" id="booking-end-time-error">{errors.endTime}</span> : null}
              </label>
            </div>
          </fieldset>

          <fieldset className="booking-group" data-booking-group disabled={isSubmitting}>
            <legend className="booking-group__eyebrow">04 / YOUR DETAILS</legend>
            <div className="booking-group__content booking-group__content--two">
              <label className="booking-field" htmlFor="booking-customer-name">
                <span>Customer name</span>
                <input
                  aria-invalid={Boolean(errors.customerName)}
                  aria-describedby={errors.customerName ? "booking-name-error" : undefined}
                  autoComplete="name"
                  id="booking-customer-name"
                  onChange={(event) => setCustomerName(event.target.value)}
                  ref={(element) => {
                    fieldRefs.current.customerName = element;
                  }}
                  required
                  value={customerName}
                />
                {errors.customerName ? <span className="booking-field__error" id="booking-name-error">{errors.customerName}</span> : null}
              </label>
              <label className="booking-field" htmlFor="booking-customer-phone">
                <span>Phone number</span>
                <input
                  aria-invalid={Boolean(errors.customerPhone)}
                  aria-describedby={errors.customerPhone ? "booking-phone-error" : undefined}
                  autoComplete="tel"
                  id="booking-customer-phone"
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  ref={(element) => {
                    fieldRefs.current.customerPhone = element;
                  }}
                  required
                  type="tel"
                  value={customerPhone}
                />
                {errors.customerPhone ? <span className="booking-field__error" id="booking-phone-error">{errors.customerPhone}</span> : null}
              </label>
              <label className="booking-field" htmlFor="booking-customer-email">
                <span>Email address</span>
                <input
                  aria-invalid={Boolean(errors.customerEmail)}
                  aria-describedby={errors.customerEmail ? "booking-email-error" : undefined}
                  autoComplete="email"
                  id="booking-customer-email"
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  ref={(element) => {
                    fieldRefs.current.customerEmail = element;
                  }}
                  required
                  type="email"
                  value={customerEmail}
                />
                {errors.customerEmail ? <span className="booking-field__error" id="booking-email-error">{errors.customerEmail}</span> : null}
              </label>
            </div>
          </fieldset>

          <fieldset className="booking-group" data-booking-group disabled={isSubmitting}>
            <legend className="booking-group__eyebrow">05 / PREFERENCES</legend>
            <div className="booking-group__content">
              <fieldset className="booking-driver">
                <legend>Rental type</legend>
                <label>
                  <input
                    checked={driver === "self-drive"}
                    name="booking-driver"
                    onChange={() => setDriver("self-drive")}
                    type="radio"
                  />
                  Self-drive
                </label>
                <label>
                  <input
                    checked={driver === "chauffeur"}
                    name="booking-driver"
                    onChange={() => setDriver("chauffeur")}
                    type="radio"
                  />
                  With driver
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
              <label className="booking-field" htmlFor="booking-additional-requests">
                <span>Additional requests <span className="booking-field__hint">(optional)</span></span>
                <textarea
                  className="booking-field__textarea"
                  id="booking-additional-requests"
                  maxLength={1000}
                  onChange={(event) => setAdditionalRequests(event.target.value)}
                  rows={4}
                  value={additionalRequests}
                />
              </label>
            </div>
          </fieldset>

          {requestError ? (
            <p className="booking-request-error" role="alert">
              {requestError}
            </p>
          ) : null}
          <div className="booking-form__actions">
            <Button
              className="booking-form__submit"
              disabled={isSubmitting}
              size="lg"
              type="submit"
            >
              {isSubmitting ? "Submitting…" : "Confirm Booking"}
              {!isSubmitting ? <ArrowUpRight aria-hidden="true" size={17} /> : null}
            </Button>
            <p>
              Your estimated price is based on the selected vehicle and rental
              duration. No taxes or additional charges are included.
            </p>
          </div>
        </form>
      </div>

      <div data-booking-summary>
        <BookingSummary
          driver={driver}
          endDate={endDate}
          endTime={endTime}
          estimatedTotal={estimatedTotal}
          pickup={pickup}
          rentalDays={rentalDays}
          returnLocation={returnLocation}
          roundTrip={roundTrip}
          startDate={startDate}
          startTime={startTime}
          vehicle={selectedVehicle}
        />
      </div>
    </div>
  );
}
