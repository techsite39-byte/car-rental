import { ChevronDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const locations = [
  "New York",
  "Los Angeles",
  "San Francisco",
  "Miami",
  "Chicago",
];

interface BookingBarProps {
  vehicleSlug: string;
}

export function BookingBar({ vehicleSlug }: BookingBarProps) {
  const router = useRouter();
  const [driver, setDriver] = useState<"with" | "without">("without");
  const [isRoundTrip, setIsRoundTrip] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = new URLSearchParams();

    for (const field of [
      "pickup",
      "return",
      "pickupDate",
      "returnDate",
    ] as const) {
      const value = formData.get(field);
      if (typeof value === "string" && value) query.set(field, value);
    }

    query.set("driver", driver);
    query.set("roundTrip", String(isRoundTrip));
    query.set("vehicle", vehicleSlug);
    router.push(`/booking?${query.toString()}`);
  }

  return (
    <div className="booking-shell" data-hero-booking>
      <form className="booking-bar" onSubmit={handleSubmit}>
        <div className="booking-bar__topline">
          <div
            aria-label="Driver preference"
            className="booking-bar__driver"
            role="group"
          >
            <span className="booking-bar__eyebrow">Driver</span>
            <div className="booking-bar__segmented">
              <button
                aria-pressed={driver === "with"}
                className="booking-bar__segment"
                onClick={() => setDriver("with")}
                type="button"
              >
                With driver
              </button>
              <button
                aria-pressed={driver === "without"}
                className="booking-bar__segment"
                onClick={() => setDriver("without")}
                type="button"
              >
                Without driver
              </button>
            </div>
          </div>

          <button
            aria-checked={isRoundTrip}
            className="booking-bar__round-trip"
            onClick={() => setIsRoundTrip((value) => !value)}
            role="switch"
            type="button"
          >
            <span className="booking-bar__switch">
              <span />
            </span>
            Round-trip
          </button>
        </div>

        <div className="booking-bar__fields">
          <label className="booking-field">
            <span>Pick-up</span>
            <span className="booking-field__control">
              <select defaultValue="" name="pickup" required>
                <option disabled value="">
                  City, place
                </option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" size={15} />
            </span>
          </label>

          <label className="booking-field">
            <span>Return</span>
            <span className="booking-field__control">
              <select
                defaultValue=""
                disabled={!isRoundTrip}
                name="return"
                required={isRoundTrip}
              >
                <option disabled value="">
                  City, place
                </option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" size={15} />
            </span>
          </label>

          <label className="booking-field">
            <span>Pick-up date</span>
            <input aria-label="Pick-up date" name="pickupDate" required type="date" />
          </label>

          <label className="booking-field">
            <span>Return date</span>
            <input
              aria-label="Return date"
              disabled={!isRoundTrip}
              name="returnDate"
              required={isRoundTrip}
              type="date"
            />
          </label>

          <button
            className="button button--primary button--lg booking-bar__submit"
            type="submit"
          >
            Book now
            <ArrowUpRight aria-hidden="true" size={16} />
          </button>
        </div>
      </form>

      <Link
        className="booking-mobile"
        href={`/booking?vehicle=${encodeURIComponent(vehicleSlug)}`}
      >
        <span>
          <strong>Ready when you are</strong>
          <span>Choose your dates and reserve your car</span>
        </span>
        <span aria-hidden="true" className="booking-mobile__icon">
          <ArrowUpRight size={18} />
        </span>
      </Link>
    </div>
  );
}
