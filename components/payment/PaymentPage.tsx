"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  Landmark,
  LockKeyhole,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { formatINR } from "@/lib/currency";
import "./PaymentPage.css";

export interface PaymentContext {
  bookingId?: string;
  bookingReference?: string;
  vehicleId?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  vehicleName?: string;
  vehicleModel?: string;
  vehicleImage?: string;
  pickupHub?: string;
  pickupDateTime?: string;
  returnDateTime?: string;
  totalAmount?: number;
  advanceAmount?: number;
  remainingAmount?: number;
}

const paymentMethods = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "credit-card", label: "Credit Card", icon: CreditCard },
  { id: "debit-card", label: "Debit Card", icon: CreditCard },
  { id: "net-banking", label: "Net Banking", icon: Landmark },
  { id: "wallet", label: "Wallet", icon: WalletCards },
] as const;

function displayValue(value: string | undefined, fallback = "Not provided") {
  return value?.trim() || fallback;
}

function formatDateTime(value?: string) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} ${month} ${year}, ${time}`;
}

function queryDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function queryTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function amount(value: number | undefined) {
  return formatINR(Number.isFinite(value) ? Math.max(value ?? 0, 0) : 0);
}

export function PaymentPage({ context }: { context: PaymentContext }) {
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [gatewayMessage, setGatewayMessage] = useState("");
  const totalAmount = context.totalAmount ?? 0;
  const advanceAmount = context.advanceAmount ?? 500;
  const remainingAmount =
    context.remainingAmount ?? Math.max(totalAmount - advanceAmount, 0);
  const hasBooking = Boolean(context.bookingId || context.bookingReference);
  const bookingHref = (() => {
    const params = new URLSearchParams();
    if (context.vehicleId) params.set("vehicle", context.vehicleId);
    if (context.pickupHub) {
      params.set("pickup", context.pickupHub);
      params.set("return", context.pickupHub);
    }
    if (context.pickupDateTime) params.set("pickupDate", queryDate(context.pickupDateTime));
    if (context.pickupDateTime) params.set("pickupTime", queryTime(context.pickupDateTime));
    if (context.returnDateTime) params.set("returnDate", queryDate(context.returnDateTime));
    if (context.returnDateTime) params.set("returnTime", queryTime(context.returnDateTime));
    if (context.customerName) params.set("name", context.customerName);
    if (context.phone) params.set("phone", context.phone);
    if (context.email) params.set("email", context.email);
    return params.size ? `/booking?${params.toString()}` : "/booking";
  })();

  if (!hasBooking) {
    return (
      <main className="payment-page">
        <div className="site-container payment-page__error-card">
          <span className="payment-page__error-icon" aria-hidden="true">!</span>
          <p className="payment-page__eyebrow">SECURE PAYMENT</p>
          <h1>Payment details unavailable</h1>
          <p>
            We could not find the booking details for this payment session. Return to
            the booking page and try again.
          </p>
          <Link className="payment-page__primary-link" href="/booking">
            Return to booking
            <ArrowLeft aria-hidden="true" size={17} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <div className="site-container">
        <header className="payment-page__header">
          <div>
            <p className="payment-page__eyebrow">EPICDRIVE / CHECKOUT</p>
            <h1>Secure Payment</h1>
            <p className="payment-page__intro">
              Review your advance payment details before continuing to the payment gateway.
            </p>
          </div>
          <div className="payment-page__header-meta">
            <span>Booking ID</span>
            <strong>{displayValue(context.bookingId ?? context.bookingReference)}</strong>
          </div>
          <Link className="payment-page__back-link" href={bookingHref}>
            <ArrowLeft aria-hidden="true" size={16} />
            Back to Booking
          </Link>
        </header>

        <div className="payment-page__grid">
          <section className="payment-card payment-card--methods" aria-labelledby="payment-method-heading">
            <div className="payment-card__heading">
              <div className="payment-card__icon"><LockKeyhole aria-hidden="true" size={18} /></div>
              <div>
                <p className="payment-page__eyebrow">ADVANCE PAYMENT</p>
                <h2 id="payment-method-heading">Pay {amount(advanceAmount)} now</h2>
              </div>
            </div>
            <div className="payment-amount-panel">
              <span>Amount to pay</span>
              <strong>{amount(advanceAmount)}</strong>
              <p>Secure your vehicle booking with the required advance payment.</p>
            </div>

            <div className="payment-methods" aria-label="Payment methods">
              <p className="payment-section-label">SELECT PAYMENT METHOD</p>
              <div className="payment-methods__grid">
                {paymentMethods.map(({ id, label, icon: Icon }) => (
                  <button
                    aria-pressed={selectedMethod === id}
                    className={`payment-method ${selectedMethod === id ? "is-selected" : ""}`}
                    key={id}
                    onClick={() => {
                      setSelectedMethod(id);
                      setGatewayMessage("");
                    }}
                    type="button"
                  >
                    <Icon aria-hidden="true" size={20} />
                    <span>{label}</span>
                    {selectedMethod === id ? <Check aria-hidden="true" className="payment-method__check" size={15} /> : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="payment-pending-notice" role="status">
              <LockKeyhole aria-hidden="true" size={17} />
              <div>
                <strong>Payment gateway configuration pending.</strong>
                <p>Secure online payment will be available soon.</p>
              </div>
            </div>
            <button
              className="payment-continue-button"
              onClick={() => setGatewayMessage("Payment gateway configuration pending. No payment was taken.")}
              type="button"
            >
              CONTINUE TO PAYMENT
              <span aria-hidden="true">→</span>
            </button>
            {gatewayMessage ? <p className="payment-gateway-message" role="alert">{gatewayMessage}</p> : null}
            <p className="payment-security-note">
              You will not be charged until a verified payment gateway is connected.
            </p>
          </section>

          <aside className="payment-card payment-card--summary" aria-labelledby="payment-summary-heading">
            <div className="payment-card__heading">
              <div className="payment-card__icon"><Building2 aria-hidden="true" size={18} /></div>
              <div>
                <p className="payment-page__eyebrow">BOOKING SUMMARY</p>
                <h2 id="payment-summary-heading">Your journey</h2>
              </div>
            </div>

            <div className="payment-vehicle">
              <div className="payment-vehicle__image">
                {context.vehicleImage ? (
                  <Image alt={displayValue(context.vehicleName, "Selected vehicle")} fill sizes="96px" src={context.vehicleImage} unoptimized />
                ) : <span>Vehicle</span>}
              </div>
              <div>
                <h3>{displayValue(context.vehicleName, "Selected vehicle")}</h3>
                <p>{displayValue(context.vehicleModel, "Vehicle details")}</p>
              </div>
            </div>

            <dl className="payment-summary-list">
              <div><dt>Booking ID</dt><dd>{displayValue(context.bookingId ?? context.bookingReference)}</dd></div>
              <div><dt>Customer</dt><dd>{displayValue(context.customerName)}</dd></div>
              <div><dt>Phone</dt><dd>{displayValue(context.phone)}</dd></div>
              <div><dt>Email</dt><dd>{displayValue(context.email)}</dd></div>
              <div><dt>Pickup hub</dt><dd>{displayValue(context.pickupHub)}</dd></div>
              <div><dt>Pickup</dt><dd>{formatDateTime(context.pickupDateTime)}</dd></div>
              <div><dt>Return</dt><dd>{formatDateTime(context.returnDateTime)}</dd></div>
            </dl>

            <div className="payment-total-list">
              <div><span>Total booking amount</span><strong>{amount(totalAmount)}</strong></div>
              <div><span>Advance payment</span><strong>{amount(advanceAmount)}</strong></div>
              <div className="payment-total-list__remaining"><span>Remaining balance</span><strong>{amount(remainingAmount)}</strong></div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
