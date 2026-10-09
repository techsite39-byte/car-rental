"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/data/site";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 12);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const menuToggle = menuToggleRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuCloseRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuToggle?.focus();
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements =
        mobileNavigationRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled)',
        );
      if (!focusableElements?.length) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      if (document.activeElement !== menuToggle) {
        menuToggle?.focus();
      }
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`navbar-shell${isScrolled ? " navbar-shell--scrolled" : ""}`}
    >
      <div className="navbar">
        <Link
          aria-label={siteConfig.brand.name}
          className="navbar__brand"
          href={siteConfig.routes.home}
          onClick={closeMenu}
        >
          <svg
            aria-hidden="true"
            className="navbar__mark"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M8.25 14.5 12 8.25l3.75 6.25" />
            <path d="M9.75 12h4.5" />
          </svg>
          <span>{siteConfig.brand.name}</span>
        </Link>

        <nav aria-label="Main navigation" className="navbar__links">
          {siteConfig.navigation.map((item) => (
            <Link className="navbar__link" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          className="button button--primary button--md navbar__reserve"
          href={siteConfig.routes.booking}
        >
          {siteConfig.ctaLabels.bookNow}
        </Link>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          className={`navbar__menu-toggle${isMenuOpen ? " navbar__menu-toggle--open" : ""}`}
          onClick={() => setIsMenuOpen((open) => !open)}
          ref={menuToggleRef}
          type="button"
        >
          <span />
          <span />
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="navbar-mobile"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="mobile-navigation"
            onClick={(event) => {
              if (event.target === event.currentTarget) closeMenu();
            }}
            role="presentation"
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            <motion.nav
              aria-label="Mobile navigation"
              aria-modal="true"
              className="navbar-mobile__content"
              id="mobile-navigation"
              ref={mobileNavigationRef}
              role="dialog"
              initial={{
                opacity: prefersReducedMotion ? 1 : 0,
                y: prefersReducedMotion ? 0 : 12,
              }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: prefersReducedMotion ? 1 : 0,
                y: prefersReducedMotion ? 0 : 8,
              }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.22,
                ease: "easeOut",
              }}
            >
              <button
                aria-label="Close navigation menu"
                className="navbar-mobile__close"
                onClick={closeMenu}
                ref={menuCloseRef}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
              {siteConfig.navigation.map((item) => (
                <Link
                  className="navbar-mobile__link"
                  href={item.href}
                  key={item.label}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                className="button button--primary button--lg navbar-mobile__reserve"
                href={siteConfig.routes.booking}
                onClick={closeMenu}
              >
                {siteConfig.ctaLabels.bookNow}
              </Link>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
