"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/data/site";

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-footer-reveal]",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footer,
            start: "top 78%",
            once: true,
          },
        },
      );
    }, footer);

    return () => context.revert();
  }, []);

  function scrollToTop() {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  return (
    <footer aria-label="Site footer" className="site-footer" ref={footerRef}>
      <section aria-labelledby="footer-cta-heading" className="footer-cta">
        <div className="site-container footer-cta__inner">
          <p className="footer-cta__eyebrow" data-footer-reveal>
            READY FOR THE ROAD?
          </p>
          <h2 data-footer-reveal id="footer-cta-heading">
            Your next
            <br />
            journey awaits.
          </h2>
          <p className="footer-cta__copy" data-footer-reveal>
            Choose your vehicle and make every mile worth remembering.
          </p>
          <div className="footer-cta__actions" data-footer-reveal>
            <Button
              href={siteConfig.routes.fleet}
              size="lg"
              variant="primary"
            >
              {siteConfig.ctaLabels.exploreFleet}
              <ArrowUpRight aria-hidden="true" size={17} />
            </Button>
            <Button
              href={siteConfig.routes.booking}
              size="lg"
              variant="secondary"
            >
              Reserve a vehicle
              <ArrowUpRight aria-hidden="true" size={17} />
            </Button>
          </div>
        </div>
      </section>

      <div className="site-container footer-main">
        <div className="footer-main__brand" data-footer-reveal>
          <Link
            aria-label={`${siteConfig.brand.name} home`}
            className="footer-brand"
            href={siteConfig.routes.home}
          >
            <svg
              aria-hidden="true"
              className="footer-brand__mark"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M8.25 14.5 12 8.25l3.75 6.25" />
              <path d="M9.75 12h4.5" />
            </svg>
            <span>{siteConfig.brand.name}</span>
          </Link>
          <p>{siteConfig.brand.tagline}</p>
        </div>

        <div className="footer-main__columns">
          <nav aria-label="Explore" className="footer-column" data-footer-reveal>
            <h2>EXPLORE</h2>
            {siteConfig.footerNavigation.explore.map((item) => (
              <Link href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Journey" className="footer-column" data-footer-reveal>
            <h2>JOURNEY</h2>
            {siteConfig.footerNavigation.journey.map((item) => (
              <Link href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="footer-column footer-column--connect" data-footer-reveal>
            <h2>CONNECT</h2>
            <span className="footer-column__note">DEMO CONTACT DETAILS</span>
            <a href={`mailto:${siteConfig.contact.email}`}>
              {siteConfig.contact.email}
            </a>
            <a
              href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`}
            >
              {siteConfig.contact.phone}
            </a>
            {siteConfig.socialLinks.map((item) => (
              <a
                href={item.href}
                key={item.label}
                rel="noreferrer"
                target="_blank"
              >
                {item.label}
                <ArrowUpRight aria-hidden="true" size={13} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © 2026 {siteConfig.brand.name}
            <span>{siteConfig.brand.tagline}</span>
          </p>
          <nav aria-label="Legal" className="footer-bottom__legal">
            {siteConfig.footerNavigation.legal.map((item) => (
              <Link href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            aria-label="Back to top"
            className="footer-back-to-top"
            onClick={scrollToTop}
            type="button"
          >
            Back to top
            <ArrowUp aria-hidden="true" size={15} />
          </button>
        </div>
      </div>
    </footer>
  );
}
