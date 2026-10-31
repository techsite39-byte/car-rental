"use client";

import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./customer-testimonials.css";

gsap.registerPlugin(ScrollTrigger);

const DEMO_STORIES = [
  {
    id: "booking",
    vehicle: "Kia Carens Clavis",
    message:
      "Approved feedback about the booking experience will appear here when a customer chooses to share it.",
  },
  {
    id: "vehicle",
    vehicle: "Maruti Suzuki Ertiga",
    message:
      "Vehicle details and customer comments will only be shown after the review is approved.",
  },
  {
    id: "journey",
    vehicle: "Renault Kiger",
    message:
      "This sample card previews the design; it is not a customer review or rating.",
  },
] as const;

const SHOW_DEMO_STORIES = process.env.NODE_ENV !== "production";

export function CustomerTestimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const stories = SHOW_DEMO_STORIES ? DEMO_STORIES : [];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const header = section.querySelector<HTMLElement>(
      ".customer-testimonials__header",
    );
    const cards = section.querySelectorAll<HTMLElement>(
      "[data-testimonial-card]",
    );
    const context = gsap.context(() => {
      const reveal = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          once: true,
        },
        defaults: { ease: "power3.out" },
      });

      if (header) {
        reveal.fromTo(
          header,
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: 0.65 },
        );
      }
      if (cards.length) {
        reveal.fromTo(
          cards,
          { autoAlpha: 0, y: 24, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.62,
            stagger: 0.12,
          },
          header ? "-=0.2" : 0,
        );
      }
    }, section);

    return () => context.revert();
  }, []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || stories.length < 2) return;

    const cards = Array.from(
      track.querySelectorAll<HTMLElement>("[data-testimonial-card]"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = cards.indexOf(entry.target as HTMLElement);
            if (index !== -1) setActiveIndex(index);
          }
        }
      },
      { root: track, threshold: 0.65 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [stories.length]);

  function scrollToStory(index: number) {
    const cards = trackRef.current?.querySelectorAll<HTMLElement>(
      "[data-testimonial-card]",
    );
    const card = cards?.[index];
    if (!card) return;

    card.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "start",
    });
    setActiveIndex(index);
  }

  return (
    <section
      aria-labelledby="customer-testimonials-heading"
      className="customer-testimonials"
      id="testimonials"
      ref={sectionRef}
    >
      <div className="customer-testimonials__inner">
        <header className="customer-testimonials__header">
          <div>
            <p className="customer-testimonials__eyebrow">
              <span aria-hidden="true" className="customer-testimonials__eyebrow-dot" />
              CUSTOMER STORIES
            </p>
            <h2 id="customer-testimonials-heading">Trusted by Drivers</h2>
            <p className="customer-testimonials__subtitle">
              Real journeys. Genuine experiences.
            </p>
          </div>
          {stories.length > 1 ? (
            <div
              aria-label="Testimonial navigation"
              className="customer-testimonials__controls"
            >
              <button
                aria-label="Previous story"
                className="customer-testimonials__arrow"
                disabled={activeIndex === 0}
                onClick={() => scrollToStory(activeIndex - 1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={18} />
              </button>
              <button
                aria-label="Next story"
                className="customer-testimonials__arrow"
                disabled={activeIndex === stories.length - 1}
                onClick={() => scrollToStory(activeIndex + 1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={18} />
              </button>
            </div>
          ) : null}
        </header>

        {stories.length ? (
          <>
            <div
              aria-label="Sample customer story cards"
              className="customer-testimonials__track"
              ref={trackRef}
              role="list"
              tabIndex={0}
            >
              {stories.map((story, index) => (
                <article
                  aria-label={`Demo card ${index + 1} of ${stories.length}`}
                  className="customer-testimonial"
                  data-testimonial-card
                  key={story.id}
                  role="listitem"
                >
                  <div className="customer-testimonial__topline">
                    <span className="customer-testimonial__demo-label">
                      DEMO PREVIEW · NOT VERIFIED
                    </span>
                    <span className="customer-testimonial__index">
                      0{index + 1} / 0{stories.length}
                    </span>
                  </div>

                  <div className="customer-testimonial__rating">
                    <span
                      aria-label="No customer rating available"
                      className="customer-testimonial__stars"
                      role="img"
                    >
                      {Array.from({ length: 5 }, (_, starIndex) => (
                        <Star
                          aria-hidden="true"
                          key={starIndex}
                          size={17}
                          strokeWidth={1.7}
                        />
                      ))}
                    </span>
                    <span>No rating submitted</span>
                  </div>

                  <blockquote className="customer-testimonial__quote">
                    {story.message}
                  </blockquote>

                  <footer className="customer-testimonial__author">
                    <span
                      aria-hidden="true"
                      className="customer-testimonial__avatar"
                    >
                      D
                    </span>
                    <span className="customer-testimonial__details">
                      <strong>Demo content · not verified</strong>
                      <small>
                        Example vehicle: {story.vehicle} · no review pairing
                      </small>
                    </span>
                  </footer>
                </article>
              ))}
            </div>

            <div
              aria-label="Choose a story card"
              className="customer-testimonials__pagination"
              role="group"
            >
              {stories.map((story, index) => (
                <button
                  aria-current={activeIndex === index ? "true" : undefined}
                  aria-label={`Show demo card ${index + 1}`}
                  className="customer-testimonials__dot"
                  key={story.id}
                  onClick={() => scrollToStory(index)}
                  type="button"
                />
              ))}
            </div>
            <p className="customer-testimonials__note">
              Development preview only. These sample cards are not customer
              feedback and contain no verified ratings.
            </p>
          </>
        ) : (
          <div className="customer-testimonials__empty">
            <div aria-hidden="true" className="customer-testimonials__empty-badge">
              <Quote size={28} strokeWidth={1.8} />
            </div>
            <p className="customer-testimonials__empty-title">Customer stories are coming soon.</p>
            <span className="customer-testimonials__empty-desc">
              Reviews will appear here once customers share their feedback and
              approve it for publication.
            </span>
            <div aria-hidden="true" className="customer-testimonials__trust-pills">
              <span className="customer-testimonials__trust-pill">★ 5.0 Star Target</span>
              <span className="customer-testimonials__trust-pill">✓ 100% Genuine Renters</span>
              <span className="customer-testimonials__trust-pill">🔒 Verified Feedback</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
