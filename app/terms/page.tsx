import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — VÉLOCE",
  description: "Terms page placeholder for the VÉLOCE frontend demo.",
};

export default function TermsPage() {
  return (
    <main className="site-container legal-page">
      <p className="booking-page__eyebrow">DEMO PAGE</p>
      <h1>Terms</h1>
      <p className="legal-page__notice">
        This is placeholder content for a website demo, not an operative terms
        of service. No booking, payment, or legal terms are established here.
      </p>
    </main>
  );
}
