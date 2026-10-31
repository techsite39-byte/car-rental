"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowUp,
  CarFront,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { siteConfig } from "@/data/site";
import "./Footer.css";

type SocialIconProps = { size?: number };

function XIcon({ size = 15 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ size = 15 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.407 24 24 23.407 24 22.675V1.325C24 .593 23.407 0 22.675 0z" />
    </svg>
  );
}

function InstagramIcon({ size = 15 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YoutubeIcon({ size = 15 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LinkedinIcon({ size = 15 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

function PinterestIcon({ size = 15 }: SocialIconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12C24.017 5.367 18.644 0 12.017 0z" />
    </svg>
  );
}

export function Footer() {
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
        {/* Column 1: Brand Info & Socials */}
        <div className="footer-col--brand">
          <Link
            aria-label={`${siteConfig.brand.name} home`}
            className="footer-brand"
            href={siteConfig.routes.home}
          >
            <Image
              alt={siteConfig.brand.fullName}
              className="footer-brand__logo"
              height={64}
              priority={false}
              src="/logo.png"
              width={256}
            />
          </Link>
          <p className="footer-brand__copy">
            Discover the freedom of the road with {siteConfig.brand.name}.
            Premium, well-maintained self-drive cars with transparent pricing and doorstep delivery.
          </p>
          <nav aria-label="Social media" className="footer-socials">
            <a aria-label="X (Twitter)" className="footer-social-link" href="#" rel="noopener noreferrer">
              <XIcon />
            </a>
            <a aria-label="Facebook" className="footer-social-link" href="#" rel="noopener noreferrer">
              <FacebookIcon />
            </a>
            <a aria-label="Instagram" className="footer-social-link" href={siteConfig.contact.instagram} rel="noopener noreferrer" target="_blank">
              <InstagramIcon />
            </a>
            <a aria-label="YouTube" className="footer-social-link" href="#" rel="noopener noreferrer">
              <YoutubeIcon />
            </a>
            <a aria-label="LinkedIn" className="footer-social-link" href="#" rel="noopener noreferrer">
              <LinkedinIcon />
            </a>
            <a aria-label="Pinterest" className="footer-social-link" href="#" rel="noopener noreferrer">
              <PinterestIcon />
            </a>
          </nav>
        </div>

        <div className="footer-v-divider" aria-hidden="true" />

        {/* Column 2: Explore */}
        <nav aria-label="Explore" className="footer-col--links">
          <h2 className="footer-col__title">EXPLORE</h2>
          <div className="footer-col__underline" aria-hidden="true" />
          <ul className="footer-links-list">
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.home}>
                <span>Home</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.deals}>
                <span>Offers</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.fleet}>
                <span>Luxury Cars</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.carsRental || siteConfig.routes.fleet}>
                <span>Cars &amp; Tariffs</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.fleet}>
                <span>Rent a Caravan</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.home}>
                <span>Blog</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.home}>
                <span>FAQs</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
          </ul>
        </nav>

        <div className="footer-v-divider" aria-hidden="true" />

        {/* Column 3: Company */}
        <nav aria-label="Company" className="footer-col--links">
          <h2 className="footer-col__title">COMPANY</h2>
          <div className="footer-col__underline" aria-hidden="true" />
          <ul className="footer-links-list">
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.contact}>
                <span>Contact Us</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.terms}>
                <span>Terms &amp; Conditions</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.privacy}>
                <span>Privacy Policy</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
            <li>
              <Link className="footer-link-item" href={siteConfig.routes.terms}>
                <span>Refund Policy</span>
                <ChevronRight aria-hidden="true" size={13} />
              </Link>
            </li>
          </ul>
        </nav>

        <div className="footer-v-divider" aria-hidden="true" />

        {/* Column 4: Get In Touch */}
        <section
          aria-labelledby="footer-contact-heading"
          className="footer-col--contact"
        >
          <h2 className="footer-col__title" id="footer-contact-heading">
            GET IN TOUCH
          </h2>
          <div className="footer-col__underline" aria-hidden="true" />
          <div className="footer-contact-list">
            <a
              className="footer-contact-item"
              href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`}
            >
              <div aria-hidden="true" className="footer-contact-icon">
                <Phone fill="currentColor" size={18} />
              </div>
              <div className="footer-contact-info">
                <strong>{siteConfig.contact.phone}</strong>
                <small>Booking Enquiries</small>
              </div>
            </a>

            <a
              className="footer-contact-item"
              href="mailto:booking@epicdrive.in"
            >
              <div aria-hidden="true" className="footer-contact-icon">
                <Mail size={18} />
              </div>
              <div className="footer-contact-info">
                <strong>booking@epicdrive.in</strong>
                <small>General Enquiries</small>
              </div>
            </a>

            <div className="footer-contact-item">
              <div aria-hidden="true" className="footer-contact-icon">
                <MapPin fill="currentColor" size={18} />
              </div>
              <div className="footer-contact-info">
                <strong>{siteConfig.brand.fullName}</strong>
                <small>{siteConfig.contact.address}</small>
              </div>
            </div>
          </div>
        </section>

        {/* Column 5: Right Promo Banner Card */}
        <section
          aria-label="Drive Your World promotion"
          className="footer-promo-card-wrapper"
        >
          <div className="footer-promo-card">
            <div className="footer-promo-card__headline">
              <span className="footer-promo-card__script">Drive</span>
              <span className="footer-promo-card__bold">Your World</span>
            </div>

            <div className="footer-promo-card__road-art" aria-hidden="true">
              <svg
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 320 90"
              >
                {/* Smooth white road ribbon */}
                <path
                  d="M0 65 Q 85 38, 165 52 T 320 32 L 320 90 L 0 90 Z"
                  fill="#ffffff"
                />
                {/* Red dashed center lane markings */}
                <path
                  d="M0 77 Q 85 50, 165 64 T 320 44"
                  stroke="#e50914"
                  strokeDasharray="6 6"
                  strokeWidth="2.75"
                />
                {/* Subtle upper white guide track */}
                <path
                  d="M0 55 Q 85 28, 165 42 T 320 22"
                  stroke="rgba(255, 255, 255, 0.45)"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
        </section>
      </div>

      {/* Sub-footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="site-container footer-bottom-bar__layout">
          <p className="footer-copyright">
            {"©"} {currentYear} {siteConfig.brand.fullName}. All rights reserved.
          </p>
          <div className="footer-bottom-nav">
            <Link href={siteConfig.routes.privacy}>Privacy</Link>
            <span aria-hidden="true" style={{ opacity: 0.35 }}>|</span>
            <Link href={siteConfig.routes.terms}>Terms</Link>
            <div className="footer-bottom-slogan">
              <CarFront aria-hidden="true" size={16} strokeWidth={2.2} />
              <span>Drive More. Worry Less.</span>
            </div>
          </div>
          <button
            aria-label="Back to top"
            className="footer-back-to-top"
            onClick={scrollToTop}
            type="button"
          >
            <ArrowUp aria-hidden="true" size={15} />
          </button>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <a
        aria-label={`Call ${siteConfig.brand.name} at ${siteConfig.contact.phone}`}
        className="footer-float-button footer-float-button--phone"
        href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`}
      >
        <Phone aria-hidden="true" fill="currentColor" size={20} />
      </a>
      <a
        aria-label={`Contact ${siteConfig.brand.name} on WhatsApp`}
        className="footer-float-button footer-float-button--whatsapp"
        href={siteConfig.contact.whatsapp}
        rel="noopener noreferrer"
        target="_blank"
      >
        <MessageCircle aria-hidden="true" fill="currentColor" size={21} />
      </a>
    </footer>
  );
}
