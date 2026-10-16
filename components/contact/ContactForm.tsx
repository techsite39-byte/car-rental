"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { siteConfig } from "@/data/site";
import {
  adminRepositories,
  createRecordId,
} from "@/lib/admin-data";

export function ContactForm() {
  const searchParams = useSearchParams();
  const vehicle = searchParams.get("vehicle") ?? "";
  const initialSubject = vehicle ? `Vehicle enquiry — ${vehicle}` : "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [message, setMessage] = useState(
    vehicle ? `I would like to enquire about ${vehicle}.` : "",
  );
  const [error, setError] = useState("");
  const [received, setReceived] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      adminRepositories.enquiries.save({
        id: createRecordId("enquiry"),
        name: name.trim(),
        email: email.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        subject: subject.trim(),
        message: message.trim(),
        submittedAt: new Date().toISOString(),
        status: "new",
      });
      setReceived(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save your message in this browser.",
      );
    }
  }

  return (
    <main className="contact-page">
      <div className="site-container contact-page__inner">
        <header className="contact-page__intro">
          <p>EPICDRIVE CAR RENTALS · MADURAI</p>
          <h1>Let&apos;s plan your next journey.</h1>
          <span>
            Share a few details and our team can follow up. This local
            prototype does not send email or messages.
          </span>
          <div>
            <a href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`}>
              {siteConfig.contact.phone}
            </a>
            <a href={siteConfig.contact.whatsapp} rel="noreferrer" target="_blank">
              WhatsApp us
            </a>
          </div>
        </header>
        <section
          aria-labelledby="contact-form-heading"
          className="contact-card"
        >
          <div>
            <p>GET IN TOUCH</p>
            <h2 id="contact-form-heading">Send an enquiry</h2>
          </div>
          {received ? (
            <div className="contact-success" role="status">
              <strong>Message received.</strong>
              <span>
                Your enquiry is saved in this browser and is not sent to a
                concierge. No booking or reservation has been confirmed.
              </span>
              <Link href="/">Return to EPICDRIVE</Link>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit}>
              <label>
                <span>Name</span>
                <input autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} />
              </label>
              <label>
                <span>Email</span>
                <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
              </label>
              <label>
                <span>Phone (optional)</span>
                <input autoComplete="tel" onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} />
              </label>
              <label>
                <span>Subject or enquiry type</span>
                <input onChange={(event) => setSubject(event.target.value)} required value={subject} />
              </label>
              <label className="contact-form__wide">
                <span>Message</span>
                <textarea onChange={(event) => setMessage(event.target.value)} required rows={6} value={message} />
              </label>
              {error ? <p className="contact-form__error" role="alert">{error}</p> : null}
              <button className="button button--primary button--lg contact-form__submit" type="submit">
                Send enquiry <span aria-hidden="true">↗</span>
              </button>
              <p className="contact-form__disclaimer">
                Saved only in this browser. This prototype does not email your
                enquiry or confirm a booking.
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
