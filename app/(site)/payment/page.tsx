import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentPage, type PaymentContext } from "@/components/payment/PaymentPage";

export const metadata: Metadata = {
  title: "Secure Payment — EPICDRIVE",
  description: "Review your EPICDRIVE booking advance payment details.",
};

type PaymentSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberValue(value: string | undefined) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export default function PaymentRoute({
  searchParams,
}: {
  searchParams: Promise<PaymentSearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <main className="payment-page">
          <div className="site-container payment-page__loading" role="status">
            Preparing secure payment…
          </div>
        </main>
      }
    >
      <PaymentRouteContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PaymentRouteContent({
  searchParams,
}: {
  searchParams: Promise<PaymentSearchParams>;
}) {
  const params = await searchParams;
  const context: PaymentContext = {
    bookingId: firstValue(params.bookingId),
    bookingReference: firstValue(params.bookingReference),
    vehicleId: firstValue(params.vehicleId),
    customerName: firstValue(params.customerName),
    phone: firstValue(params.phone),
    email: firstValue(params.email),
    vehicleName: firstValue(params.vehicleName),
    vehicleModel: firstValue(params.vehicleModel),
    vehicleImage: firstValue(params.vehicleImage),
    pickupHub: firstValue(params.pickupHub),
    pickupDateTime: firstValue(params.pickupDateTime),
    returnDateTime: firstValue(params.returnDateTime),
    totalAmount: numberValue(firstValue(params.totalAmount)),
    advanceAmount: numberValue(firstValue(params.advanceAmount)),
    remainingAmount: numberValue(firstValue(params.remainingAmount)),
  };

  return <PaymentPage context={context} />;
}
