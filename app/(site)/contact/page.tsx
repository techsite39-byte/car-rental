import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact VÉLOCE — Premium Car Rental",
  description: "Send an enquiry to the VÉLOCE concierge.",
};

export default function ContactPage() {
  return (
    <Suspense fallback={<main className="contact-page"><div className="site-container">Loading contact form…</div></main>}>
      <ContactForm />
    </Suspense>
  );
}
