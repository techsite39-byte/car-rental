import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — VÉLOCE",
  description: "Privacy page placeholder for the VÉLOCE frontend demo.",
};

export default function PrivacyPage() {
  return (
    <main className="site-container legal-page">
      <p className="booking-page__eyebrow">DEMO PAGE</p>
      <h1>Privacy</h1>
      <p className="legal-page__notice">
        This is placeholder content for a website demo, not an operative privacy
        notice. No privacy commitments or legal terms are stated here.
      </p>
    </main>
  );
}
