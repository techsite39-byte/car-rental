"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { gsap } from "gsap";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { Button } from "@/components/ui/Button";
import { bookingVehicles } from "@/data/vehicles";
import { useFleetCollection } from "@/lib/use-fleet-collection";
import {
  DEMO_PICKUP_LOCATIONS,
  isValidBookingDate,
  type DriverPreference,
} from "@/lib/booking";
import { formatINR } from "@/lib/currency";
import "./BookingForm.css";

export interface BookingContext {
  vehicle?: string;
  pickup?: string;
  returnLocation?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  customerName?: string;
  customerPhone?: string;
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
  const { items: fleetVehicles } = useFleetCollection(bookingVehicles);
  const pageRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLElement>(null);
  const fieldRefs = useRef<Partial<Record<BookingField, BookingInput | null>>>(
    {},
  );
  const idempotencyRequest = useRef<{
    body: string;
    key: string;
  } | null>(null);
  const submissionInProgress = useRef(false);
  const [vehicleIdentifier, setVehicleIdentifier] = useState(() => {
    const initialVehicle = fleetVehicles.find(
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
  const [startTime, setStartTime] = useState(
    initialContext.startTime ?? "10:00",
  );
  const [endDate, setEndDate] = useState(initialContext.endDate ?? "");
  const [endTime, setEndTime] = useState(
    initialContext.endTime ?? "10:00",
  );
  const [driver, setDriver] = useState<DriverPreference>(
    getDriverPreference(initialContext.driver),
  );
  const [roundTrip, setRoundTrip] = useState(
    initialContext.roundTrip === undefined ||
      initialContext.roundTrip === "true",
  );
  const [customerName, setCustomerName] = useState(
    initialContext.customerName ?? "",
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialContext.customerPhone ?? "",
  );
  const [customerEmail, setCustomerEmail] = useState("");
  const [additionalRequests, setAdditionalRequests] = useState("");
  const [pickupPreference, setPickupPreference] = useState<"self" | "delivery">("self");
  const [originalProof, setOriginalProof] = useState("");
  const [professionalProof, setProfessionalProof] = useState("");
  const [idProof, setIdProof] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [errors, setErrors] = useState<BookingErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] =
    useState<SavedBooking | null>(null);
  const [today, setToday] = useState("");

  const selectedVehicle = useMemo(
    () =>
      fleetVehicles.find(
        (vehicle) =>
          vehicle.id === vehicleIdentifier ||
          vehicle.slug === vehicleIdentifier,
      ) ?? null,
    [fleetVehicles, vehicleIdentifier],
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
    if (submissionInProgress.current) return;
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

    submissionInProgress.current = true;
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
      submissionInProgress.current = false;
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

      <div className="booking-layout__main">
        <form
          className="booking-form"
          id="booking-form"
          method="post"
          noValidate
          onSubmit={submitBooking}
        >
          {/* A. TRIP TIMELINE */}
          <fieldset
            className="booking-group"
            data-booking-group
            disabled={isSubmitting}
          >
            <legend className="booking-group__eyebrow">
              <span className="step-number">1</span> TRIP TIMELINE
              <small>{pickup || "Location"} - {returnLocation || "Location"}</small>
            </legend>
            <div className="booking-group__content">
              <div className="timeline-grid">
                <div className="timeline-section">
                  <label className="booking-field" htmlFor="booking-start-date">
                    <span>PICKUP</span>
                    <div className="field-with-sub">
                      <input
                        aria-invalid={Boolean(errors.startDate)}
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
                      <input
                        aria-invalid={Boolean(errors.startTime)}
                        id="booking-start-time"
                        onChange={(event) => setStartTime(event.target.value)}
                        ref={(element) => {
                          fieldRefs.current.startTime = element;
                        }}
                        required
                        type="time"
                        value={startTime}
                      />
                    </div>
                    {errors.startDate || errors.startTime ? (
                      <span className="booking-field__error">
                        {errors.startDate || errors.startTime}
                      </span>
                    ) : (
                      <span className="field-sub-label">
                        {startDate ? formatDateTime(`${startDate}T${startTime}`) : "Select date & time"}
                      </span>
                    )}
                  </label>
                </div>

                <div className="timeline-connector">
                  →
                </div>

                <div className="timeline-section">
                  <label className="booking-field" htmlFor="booking-end-date">
                    <span>RETURN</span>
                    <div className="field-with-sub">
                      <input
                        aria-invalid={Boolean(errors.endDate)}
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
                      <input
                        aria-invalid={Boolean(errors.endTime)}
                        id="booking-end-time"
                        onChange={(event) => setEndTime(event.target.value)}
                        ref={(element) => {
                          fieldRefs.current.endTime = element;
                        }}
                        required
                        type="time"
                        value={endTime}
                      />
                    </div>
                    {errors.endDate || errors.endTime ? (
                      <span className="booking-field__error">
                        {errors.endDate || errors.endTime}
                      </span>
                    ) : (
                      <span className="field-sub-label">
                        {endDate ? formatDateTime(`${endDate}T${endTime}`) : "Select date & time"}
                      </span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </fieldset>

          {/* B. PICKUP PREFERENCE */}
          <fieldset
            className="booking-group"
            data-booking-group
            disabled={isSubmitting}
          >
            <legend className="booking-group__eyebrow">
              <span className="step-number">2</span> PICKUP PREFERENCE
            </legend>
            <div className="booking-group__content">
              <div className="pickup-preference-grid">
                <label className={`preference-card ${pickupPreference === "self" ? "is-selected" : ""}`}>
                  <input
                    checked={pickupPreference === "self"}
                    name="pickup-preference"
                    onChange={() => setPickupPreference("self")}
                    type="radio"
                  />
                  <div className="preference-info">
                    <strong>Self pickup</strong>
                    <small>Collect the car from Madurai. No pickup charges.</small>
                  </div>
                </label>
                <label className={`preference-card ${pickupPreference === "delivery" ? "is-selected" : ""}`}>
                  <input
                    checked={pickupPreference === "delivery"}
                    name="pickup-preference"
                    onChange={() => setPickupPreference("delivery")}
                    type="radio"
                  />
                  <div className="preference-info">
                    <strong>Delivery</strong>
                    <small>Get the car delivered to your location. Delivery fee applies.</small>
                  </div>
                </label>
              </div>
              <div className="hub-info">
                <span>Pickup hub: <strong className="hub-name">Madurai - Madurai</strong></span>
                <p>(Please arrive 10-15 minutes before your pickup time.)</p>
              </div>
            </div>
          </fieldset>

          {/* C. DOCUMENTS & NOTES */}
          <fieldset
            className="booking-group"
            data-booking-group
            disabled={isSubmitting}
          >
            <legend className="booking-group__eyebrow">
              <span className="step-number">3</span> DOCUMENTS &amp; NOTES
            </legend>
            <div className="booking-group__content">
              <div className="docs-grid">
                <label className="booking-field" htmlFor="booking-original-proof">
                  <span>ORIGINAL PROOF *</span>
                  <select
                    id="booking-original-proof"
                    onChange={(event) => setOriginalProof(event.target.value)}
                    value={originalProof}
                  >
                    <option value="">Select Original Proof</option>
                    <option>Driving licence</option>
                    <option>Passport</option>
                  </select>
                </label>
                <label className="booking-field" htmlFor="booking-professional-proof">
                  <span>PROFESSIONAL PROOF</span>
                  <select
                    id="booking-professional-proof"
                    onChange={(event) => setProfessionalProof(event.target.value)}
                    value={professionalProof}
                  >
                    <option value="">Select Professional Proof</option>
                    <option>Company ID</option>
                    <option>Business card</option>
                    <option>Not applicable</option>
                  </select>
                </label>
                <label className="booking-field" htmlFor="booking-id-proof">
                  <span>ID PROOF</span>
                  <select
                    id="booking-id-proof"
                    onChange={(event) => setIdProof(event.target.value)}
                    value={idProof}
                  >
                    <option value="">Select ID Proof</option>
                    <option>Aadhaar card</option>
                    <option>Passport</option>
                    <option>Voter ID</option>
                  </select>
                </label>
              </div>
              <label className="booking-field" htmlFor="booking-additional-requests">
                <span>SPECIAL INSTRUCTIONS <span className="booking-field__hint">(optional)</span></span>
                <textarea
                  className="booking-field__textarea"
                  id="booking-additional-requests"
                  maxLength={1000}
                  onChange={(event) => setAdditionalRequests(event.target.value)}
                  placeholder="Share any special requests for pickup, accessories, or notes for our team."
                  rows={4}
                  value={additionalRequests}
                />
              </label>
            </div>
          </fieldset>
        </form>
      </div>

      <aside className="booking-payment-stack" aria-label="Payment details">
        {/* A. COUPON */}
        <section className="booking-side-card booking-side-card--coupon">
          <div className="booking-side-card__heading">
            <div className="icon-badge"><Check size={14} /></div>
            <div>
              <span>COUPON</span>
              <small>Apply a coupon to save more</small>
            </div>
          </div>
          <div className="booking-coupon-row">
            <input
              aria-label="Coupon code"
              onChange={(event) => setCoupon(event.target.value)}
              placeholder="Select Your Coupon code"
              value={coupon}
            />
            <button
              onClick={() =>
                setCouponMessage(
                  coupon.trim()
                    ? "Coupon will be checked at confirmation."
                    : "Enter a coupon code first."
                )
              }
              type="button"
            >
              ›
            </button>
          </div>
          {couponMessage ? (
            <p className="booking-side-card__message" role="status">
              {couponMessage}
            </p>
          ) : null}
        </section>

        {/* B. FARE SUMMARY */}
        <section className="booking-side-card booking-side-card--fare">
          <div className="booking-side-card__heading">
            <div className="icon-badge"><Check size={14} /></div>
            <div>
              <span>FARE SUMMARY</span>
              <small>Transparent breakup of your rental charges.</small>
            </div>
          </div>
          <dl className="booking-fare-list">
            <div>
              <dt>Base tariff</dt>
              <dd>{estimatedTotal === null ? "—" : formatINR(estimatedTotal)}</dd>
            </div>
            <div>
              <dt>Pickup Charge <small>(SELF PICKUP)</small></dt>
              <dd className="free">Free</dd>
            </div>
            <div>
              <dt>Drop Charge <small>(SELF DROP)</small></dt>
              <dd className="free">Free</dd>
            </div>
            <div>
              <dt>Security deposit</dt>
              <dd>₹0.00</dd>
            </div>
          </dl>
          <div className="booking-fare-total">
            <span>Total payable</span>
            <strong>{estimatedTotal === null ? "—" : formatINR(estimatedTotal)}</strong>
          </div>
          <p className="fare-note">Taxes are accrued but included. Your booking is confirmed instantly after successful payment.</p>
        </section>

        {/* C. PAYMENT ACTIONS */}
        <section className="booking-side-card booking-side-card--actions">
          <button className="pay-now-button" type="button">
            PAY ₹1,000.00 NOW <small>Balances on pickup</small>
          </button>
          <Button
            className="booking-proceed-button"
            form="booking-form"
            loading={isSubmitting}
            size="lg"
            type="submit"
          >
            PROCEED TO PAY {estimatedTotal ? formatINR(estimatedTotal) : ""}
          </Button>
          <p className="payment-terms">By continuing, you agree to our rental terms, deposit policy and cancellation rules.</p>
        </section>
      </aside>
    </div>
  );
}
