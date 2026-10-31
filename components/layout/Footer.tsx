"use client";

import Link from "next/link";
import {
  ArrowUp,
  Camera,
  ChevronRight,
  Globe2,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { siteConfig } from "@/data/site";

type SocialIconProps = { size?: number };

function XIcon({ size = 16 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ size = 16 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.407 24 24 23.407 24 22.675V1.325C24 .593 23.407 0 22.675 0z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YoutubeIcon({ size = 16 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

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
            Discover the freedom of the road with {siteConfig.brand.name}.
            Premium, well-maintained self-drive cars with transparent pricing and doorstep delivery.
          </p>
          <nav aria-label="Social media" className="footer-socials">
            <a aria-label="X (Twitter)" className="footer-social-link" href="#"><XIcon size={16} /></a>
            <a aria-label="Facebook" className="footer-social-link" href="#"><FacebookIcon size={16} /></a>
            <a aria-label="Instagram" className="footer-social-link" href="#"><InstagramIcon size={16} /></a>
            <a aria-label="YouTube" className="footer-social-link" href="#"><YoutubeIcon size={16} /></a>
            <a aria-label="LinkedIn" className="footer-social-link" href="#"><LinkedinIcon size={16} /></a>
            <a aria-label="Pinterest" className="footer-social-link" href="#"><Globe2 size={16} /></a>
          </nav>
        </div>

        <div className="footer-divider" aria-hidden="true" />

        <nav aria-label="Explore" className="footer-column">
          <h2 className="footer-column__heading">EXPLORE</h2>
          <div className="footer-links">
            <Link href={siteConfig.routes.home}>Home <ChevronRight aria-hidden="true" size={14} /></Link>
            <Link href={siteConfig.routes.deals}>Offers <ChevronRight aria-hidden="true" size={14} /></Link>
            <Link href={siteConfig.routes.fleet}>Luxury Cars <ChevronRight aria-hidden="true" size={14} /></Link>
            <Link href={siteConfig.routes.fleet}>Cars & Tariffs <ChevronRight aria-hidden="true" size={14} /></Link>
            <Link href={siteConfig.routes.fleet}>Rent a Caravan <ChevronRight aria-hidden="true" size={14} /></Link>
            <Link href={siteConfig.routes.home}>Blog <ChevronRight aria-hidden="true" size={14} /></Link>
            <Link href={siteConfig.routes.home}>FAQs <ChevronRight aria-hidden="true" size={14} /></Link>
          </div>
        </nav>

        <div className="footer-divider" aria-hidden="true" />

        <nav aria-label="Company" className="footer-column">
          <h2 className="footer-column__heading">COMPANY</h2>
          <div className="footer-links">
            <Link href={siteConfig.routes.contact}>Contact Us <ChevronRight aria-hidden="true" size={14} /></Link>
            <Link href={siteConfig.routes.terms}>Terms & Conditions <ChevronRight aria-hidden="true" size={14} /></Link>
            <Link href={siteConfig.routes.privacy}>Privacy Policy <ChevronRight aria-hidden="true" size={14} /></Link>
            <Link href={siteConfig.routes.terms}>Refund Policy <ChevronRight aria-hidden="true" size={14} /></Link>
          </div>
        </nav>

        <div className="footer-divider" aria-hidden="true" />

        <section
          aria-labelledby="footer-contact-heading"
          className="footer-column footer-column--contact"
        >
          <h2 className="footer-column__heading" id="footer-contact-heading">
            GET IN TOUCH
          </h2>
          <div className="footer-contact__item-wrapper">
            <a
              className="footer-contact__item"
              href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`}
            >
              <span aria-hidden="true" className="footer-contact__icon">
                <Phone size={18} fill="currentColor" />
              </span>
              <div className="footer-contact__text">
                <strong>{siteConfig.contact.phone}</strong>
                <small>Booking Enquiries</small>
              </div>
            </a>
            <a
              className="footer-contact__item"
              href={`mailto:booking@epicdrive.in`}
            >
              <span aria-hidden="true" className="footer-contact__icon">
                <Globe2 size={18} />
              </span>
              <div className="footer-contact__text">
                <strong>booking@epicdrive.in</strong>
                <small>General Enquiries</small>
              </div>
            </a>
            <div className="footer-contact__item">
              <span aria-hidden="true" className="footer-contact__icon">
                <MapPin size={18} fill="currentColor" />
              </span>
              <div className="footer-contact__text">
                <strong>{siteConfig.brand.fullName}</strong>
                <small>{siteConfig.contact.address}</small>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="footer-promo-heading"
          className="footer-promo-banner"
        >
          <div className="footer-promo-banner__card">
            <div className="footer-promo-banner__content">
              <h2>Drive Your World</h2>
            </div>
            <div className="footer-promo-banner__road-wrapper">
              <svg
                aria-hidden="true"
                className="footer-promo-banner__road"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 400 100"
              >
                <path
                  d="M0 80 Q100 40 200 60 T400 20"
                  stroke="white"
                  strokeOpacity="0.3"
                  strokeWidth="2"
                />
                <path
                  d="M0 90 Q100 50 200 70 T400 30"
                  stroke="white"
                  strokeDasharray="8 8"
                  strokeWidth="3"
                />
              </svg>
            </div>
          </div>
        </section>
      </div>


      <div className="footer-bottom-bar">
        <div className="site-container footer-bottom-bar__layout">
          <p className="footer-copyright">
            {"©"} {currentYear} {siteConfig.brand.fullName}. All rights reserved.
          </p>
          <nav aria-label="Footer legal" className="footer-legal">
            <Link href={siteConfig.routes.privacy}>Privacy</Link>
            <span className="footer-legal__divider">|</span>
            <Link href={siteConfig.routes.terms}>Terms</Link>
            <span className="footer-legal__divider">|</span>
            <div className="footer-legal__slogan">
              <span className="slogan-icon">🚗</span>
              Drive More. Worry Less.
            </div>
          </nav>
          <button
            aria-label="Back to top"
            className="footer-back-to-top"
            onClick={scrollToTop}
            type="button"
          >
            <ArrowUp aria-hidden="true" size={18} />
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
