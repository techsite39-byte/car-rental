"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
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
    <footer
      aria-label="Site footer"
      className="site-footer"
      id="contact"
      ref={footerRef}
    >
      <section aria-labelledby="footer-cta-heading" className="footer-cta">
        <div aria-hidden="true" className="footer-cta__car">
          <Image
            alt=""
            fill
            priority
            sizes="(max-width: 700px) 0px, 50vw"
            src="/images/vehicles/kia-carens-clavis.jpg"
          />
        </div>
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
              Book Now
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
            <Image
              alt={siteConfig.brand.fullName}
              className="footer-brand__logo"
              height={64}
              src="/images/brand/epicdrive-logo.svg"
              width={256}
            />
          </Link>
          <p className="footer-main__tagline">{siteConfig.brand.tagline}</p>
          <p className="footer-main__location">{siteConfig.contact.address}</p>
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
            <span className="footer-column__note">MADURAI · TAMIL NADU</span>
            <a
              href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`}
            >
              {siteConfig.contact.phone}
            </a>
            {siteConfig.socialLinks.map((item) => (
              <a
                href={item.href}
                key={item.label}
                rel="noopener noreferrer"
                target="_blank"
                className="footer-social-link"
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
            <a href="/images/vehicles/ATTRIBUTION.txt">Image credits</a>
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
