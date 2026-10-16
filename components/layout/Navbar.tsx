"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { siteConfig } from "@/data/site";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  const previousBodyOverflowRef = useRef("");
  const pendingAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    const hash = pendingAnchorRef.current;
    if (pathname !== siteConfig.routes.home || !hash) return;

    let frame = 0;
    const startedAt = performance.now();
    const scrollToAnchor = () => {
      const sequences = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".frame-sequence, .section2-sequence",
        ),
      );
      const pinsReady =
        sequences.length === 2 &&
        sequences.every((sequence) =>
          sequence.parentElement?.classList.contains("pin-spacer"),
        );

      if (!pinsReady && performance.now() - startedAt < 5000) {
        frame = window.requestAnimationFrame(scrollToAnchor);
        return;
      }

      const target = document.querySelector<HTMLElement>(hash);
      if (target) {
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      }
      pendingAnchorRef.current = null;
    };

    frame = window.requestAnimationFrame(scrollToAnchor);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, prefersReducedMotion]);

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
    previousBodyOverflowRef.current = previousOverflow;
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

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigateToAnchor = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    closeMenu();
    const destination = new URL(href, window.location.href);
    if (
      destination.pathname !== siteConfig.routes.home ||
      !destination.hash ||
      pathname === siteConfig.routes.home
    ) {
      return;
    }

    event.preventDefault();
    pendingAnchorRef.current = destination.hash;
    router.push(destination.pathname);
  };

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
          <Image
            alt={siteConfig.brand.fullName}
            className="navbar__logo"
            height={64}
            priority
            src="/images/brand/epicdrive-logo.svg"
            width={256}
          />
        </Link>

        <nav aria-label="Main navigation" className="navbar__links">
          {siteConfig.navigation.map((item) => (
            <Link
              className="navbar__link"
              href={item.href}
              key={item.label}
              onClick={(event) => navigateToAnchor(event, item.href)}
            >
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
                  onClick={(event) => navigateToAnchor(event, item.href)}
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
