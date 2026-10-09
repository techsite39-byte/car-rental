import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingForm } from "@/components/booking/BookingForm";

export const metadata: Metadata = {
  title: "Reserve Your Journey — VÉLOCE",
  description:
    "Reserve a premium vehicle with VÉLOCE and plan your next journey.",
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
          <p className="booking-page__eyebrow">RESERVE YOUR JOURNEY</p>
          <h1>
            Your next
            <br />
            journey starts here.
          </h1>
          <p className="booking-page__intro">
            Choose your vehicle, dates, and preferences. We&apos;ll take care of
            the rest.
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
        startDate: firstValue(params.startDate),
        endDate: firstValue(params.endDate),
        driver: firstValue(params.driver),
        roundTrip: firstValue(params.roundTrip),
      }}
    />
  );
}
