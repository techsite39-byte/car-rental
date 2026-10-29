"use client";

import Link from "next/link";
import {
  ArrowUp,
  ArrowUpRight,
  AtSign,
  ChevronRight,
  Globe2,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { siteConfig } from "@/data/site";

export function Footer() {
  // Keep the footer deterministic during Next's server/client prerender.
  const currentYear = 2026;

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
    >
      <div className="site-container footer-main">
        <div className="footer-main__brand">
          <Link
            aria-label={`${siteConfig.brand.name} home`}
            className="footer-brand"
            href={siteConfig.routes.home}
          >
            <Image
              alt={siteConfig.brand.fullName}
              className="footer-brand__logo"
              height={64}
              src="/logo.png"
              width={256}
            />
          </Link>
          <p className="footer-brand__copy">
            Plan your next journey with EPICDRIVE self-drive car rentals in
            Madurai.
          </p>
          <nav aria-label="Social media" className="footer-socials">
            {siteConfig.socialLinks.map((item) => {
              const Icon =
                item.label === "WhatsApp"
                  ? MessageCircle
                  : item.label === "@Epicdrive.in"
                    ? AtSign
                    : Globe2;

              return (
                <a
                  aria-label={item.label}
                  className="footer-social-link"
                  href={item.href}
                  key={item.label}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                </a>
              );
            })}
          </nav>
        </div>

        <nav aria-label="Explore" className="footer-column">
          <h2 className="footer-column__heading">Explore</h2>
          <Link href={siteConfig.routes.home}>Home <ChevronRight aria-hidden="true" size={14} /></Link>
          <Link href={siteConfig.routes.deals}>Offers <ChevronRight aria-hidden="true" size={14} /></Link>
          <Link href={siteConfig.routes.fleet}>Cars &amp; Fleet <ChevronRight aria-hidden="true" size={14} /></Link>
          <Link href={siteConfig.routes.booking}>Book Now <ChevronRight aria-hidden="true" size={14} /></Link>
        </nav>

        <nav aria-label="Company" className="footer-column">
          <h2 className="footer-column__heading">Company</h2>
          <Link href={siteConfig.routes.about}>About Us <ChevronRight aria-hidden="true" size={14} /></Link>
          <Link href={siteConfig.routes.contact}>Contact Us <ChevronRight aria-hidden="true" size={14} /></Link>
          <Link href={siteConfig.routes.terms}>Terms &amp; Conditions <ChevronRight aria-hidden="true" size={14} /></Link>
          <Link href={siteConfig.routes.privacy}>Privacy Policy <ChevronRight aria-hidden="true" size={14} /></Link>
        </nav>

        <section
          aria-labelledby="footer-contact-heading"
          className="footer-column footer-column--contact"
        >
          <h2 className="footer-column__heading" id="footer-contact-heading">
            Get in Touch
          </h2>
          <a
            className="footer-contact__item"
            href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`}
          >
            <span aria-hidden="true" className="footer-contact__icon">
              <Phone size={16} />
            </span>
            <span>{siteConfig.contact.phone}</span>
          </a>
          <p className="footer-contact__item">
            <span aria-hidden="true" className="footer-contact__icon">
              <MapPin size={16} />
            </span>
            <span>{siteConfig.contact.address}</span>
          </p>
        </section>

        <section
          aria-labelledby="footer-promo-heading"
          className="footer-promo"
        >
          <svg
            aria-hidden="true"
            className="footer-promo__road"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 500 150"
          >
            <path
              d="M-20 142C70 124 102 97 155 106c54 9 63 47 128 35 66-12 107-67 237-78"
              stroke="currentColor"
              strokeOpacity=".3"
              strokeWidth="2"
            />
            <path
              d="M-20 150C73 132 108 105 158 114c50 9 67 47 129 35 70-13 112-66 233-77"
              stroke="currentColor"
              strokeDasharray="9 10"
              strokeOpacity=".85"
              strokeWidth="2"
            />
          </svg>
          <div className="footer-promo__content">
            <p className="footer-promo__eyebrow">{siteConfig.brand.tagline}</p>
            <h2 id="footer-promo-heading">Your next journey awaits.</h2>
            <p>Choose your vehicle and plan your drive.</p>
            <Link className="footer-promo__link" href={siteConfig.routes.booking}>
              Book your car
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </section>

        <div className="footer-bottom">
          <svg
            aria-hidden="true"
            className="footer-bottom__road"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 900 100"
          >
            <path d="M-20 88C145 26 218 82 346 54s206-36 300 4 164 5 294-30" />
            <path d="M-20 98C145 36 218 92 346 64s206-36 300 4 164 5 294-30" />
          </svg>
          <p>
            {"©"} {currentYear ?? 2026} {siteConfig.brand.name}
            <span>{siteConfig.brand.tagline}</span>
          </p>
          <a
            className="footer-bottom__legal-link"
            href={siteConfig.routes.privacy}
          >
            Privacy
          </a>
          <a
            className="footer-bottom__legal-link"
            href={siteConfig.routes.terms}
          >
            Terms
          </a>
          <a
            className="footer-bottom__credits"
            href="/images/vehicles/ATTRIBUTION.txt"
          >
            Image credits
          </a>
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
      <a
        aria-label={`Call EPICDRIVE at ${siteConfig.contact.phone}`}
        className="footer-float-button footer-float-button--phone"
        href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`}
      >
        <Phone aria-hidden="true" size={20} />
      </a>
      <a
        aria-label="Contact EPICDRIVE on WhatsApp"
        className="footer-float-button footer-float-button--whatsapp"
        href={siteConfig.contact.whatsapp}
        rel="noopener noreferrer"
        target="_blank"
      >
        <MessageCircle aria-hidden="true" size={21} />
      </a>
    </footer>
  );
}
