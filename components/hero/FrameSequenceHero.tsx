"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CarFront, CalendarDays, Clock3, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/data/site";
import "./FrameSequenceHero.css";

export function HomeVideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const syncPlaybackWithMotionPreference = () => {
      const shouldPause = reducedMotionQuery.matches || document.hidden;
      video.autoplay = !shouldPause;
      if (shouldPause) {
        video.pause();
        return;
      }

      const videoRect = video.getBoundingClientRect();
      const isVisible =
        videoRect.top < window.innerHeight * 1.25 &&
        videoRect.bottom > 0;

      if (!isVisible) {
        video.pause();
        return;
      }

      void video.play().catch(() => undefined);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          syncPlaybackWithMotionPreference();
          return;
        }

        video.pause();
      },
      { threshold: 0.1 },
    );

    observer.observe(video);
    syncPlaybackWithMotionPreference();
    reducedMotionQuery.addEventListener(
      "change",
      syncPlaybackWithMotionPreference,
    );
    document.addEventListener("visibilitychange", syncPlaybackWithMotionPreference);

    return () => {
      observer.disconnect();
      reducedMotionQuery.removeEventListener(
        "change",
        syncPlaybackWithMotionPreference,
      );
      document.removeEventListener(
        "visibilitychange",
        syncPlaybackWithMotionPreference,
      );
    };
  }, []);

  return (
    <section
      aria-label="Cinematic automotive showcase"
      className="home-video-hero"
    >
      <video
        aria-hidden="true"
        autoPlay={false}
        className="home-video-hero__video"
        loop
        muted
        playsInline
        poster="/hero1-poster.jpg"
        preload="none"
        ref={videoRef}
        tabIndex={-1}
      >
        <source src="/hero1.mp4" type="video/mp4" />
      </video>
      <div className="home-video-hero__copy">
        <h1 className="home-video-hero__heading">
          <span>DRIVE YOUR</span>
          <span className="home-video-hero__heading-accent">JOURNEY</span>
        </h1>
        <p className="home-video-hero__tagline">Explore. Book. Drive.</p>
        <p className="home-video-hero__description">
          Best Car Rental Services
          <br />
          Quick &amp; Easy Booking
        </p>
        <Link
          className="home-video-hero__cta"
          href={siteConfig.routes.booking}
        >
          BOOK NOW
        </Link>
      </div>
      <ul aria-label="Rental service benefits" className="home-video-hero__features">
        <li className="home-video-hero__feature">
          <CarFront aria-hidden="true" className="home-video-hero__feature-icon" />
          <span>Wide Range of Cars</span>
        </li>
        <li className="home-video-hero__feature">
          <ShieldCheck
            aria-hidden="true"
            className="home-video-hero__feature-icon"
          />
          <span>Best Price Guarantee</span>
        </li>
        <li className="home-video-hero__feature">
          <CalendarDays
            aria-hidden="true"
            className="home-video-hero__feature-icon"
          />
          <span>Easy Booking</span>
        </li>
        <li className="home-video-hero__feature">
          <Clock3 aria-hidden="true" className="home-video-hero__feature-icon" />
          <span>24/7 Support</span>
        </li>
      </ul>
    </section>
  );
}
