import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact EPICDRIVE Car Rentals — Madurai",
  description: "Contact EPICDRIVE Car Rentals in Madurai.",
};

export default function ContactPage() {
  return (
    <Suspense fallback={<main className="contact-page"><div className="site-container">Loading contact form…</div></main>}>
      <ContactForm />
    </Suspense>
  );
}
