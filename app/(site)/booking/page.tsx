import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingForm } from "@/components/booking/BookingForm";

export const metadata: Metadata = {
  title: "Book Your Journey — EPICDRIVE",
  description:
    "Book a self-drive vehicle with EPICDRIVE Car Rentals in Madurai.",
};

type BookingSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function BookingPage({
  searchParams,
}: {
  searchParams: Promise<BookingSearchParams>;
}) {
  return (
    <main className="booking-page">
      <div className="site-container">
        <header className="booking-page__header" data-booking-reveal>
          <p className="booking-page__eyebrow">BOOK YOUR JOURNEY</p>
          <h1>
            Your next
            <br />
            journey starts here.
          </h1>
          <p className="booking-page__intro">
            Choose your vehicle, dates, and preferences. Our team will confirm
            the final details with you.
          </p>
        </header>
        <Suspense
          fallback={
            <p aria-live="polite" className="booking-loading" role="status">
              Preparing your journey…
            </p>
          }
        >
          <BookingFormWithContext searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function BookingFormWithContext({
  searchParams,
}: {
  searchParams: Promise<BookingSearchParams>;
}) {
  const params = await searchParams;

  return (
    <BookingForm
      initialContext={{
        vehicle: firstValue(params.vehicle),
        pickup: firstValue(params.pickup),
        returnLocation: firstValue(params.return),
        startDate:
          firstValue(params.startDate) ?? firstValue(params.pickupDate),
        endDate: firstValue(params.endDate) ?? firstValue(params.returnDate),
        driver: firstValue(params.driver),
        roundTrip: firstValue(params.roundTrip),
      }}
    />
  );
}
