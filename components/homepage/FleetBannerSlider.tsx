"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import "./fleet-banner-slider.css";

const slides = [
  { src: "/slide1.png", alt: "EPICDRIVE featured vehicle" },
  { src: "/slide2.png", alt: "EPICDRIVE featured vehicle" },
  { src: "/slide3.png", alt: "EPICDRIVE featured vehicle" },
  { src: "/slide4.png", alt: "EPICDRIVE featured vehicle" },
  { src: "/slide5.png", alt: "EPICDRIVE featured vehicle" },
] as const;

export function FleetBannerSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section aria-label="Featured EPICDRIVE offers" className="fleet-banner-slider">
      <div className="fleet-banner-slider__viewport">
        {slides.map((slide, index) => (
          <div
            aria-hidden={index !== activeIndex}
            className={`fleet-banner-slider__slide${index === activeIndex ? " fleet-banner-slider__slide--active" : ""}`}
            key={slide.src}
          >
            <Image
              alt={slide.alt}
              fill
              loading={index === 0 ? "eager" : "lazy"}
              sizes="(max-width: 700px) calc(100vw - 2rem), (max-width: 1200px) calc(100vw - 4rem), 1200px"
              src={slide.src}
            />
          </div>
        ))}
      </div>

      <div className="fleet-banner-slider__dots" role="tablist" aria-label="Featured slides">
        {slides.map((slide, index) => (
          <button
            aria-label={`Show slide ${index + 1}`}
            aria-selected={index === activeIndex}
            className={`fleet-banner-slider__dot${index === activeIndex ? " fleet-banner-slider__dot--active" : ""}`}
            key={slide.src}
            onClick={() => setActiveIndex(index)}
            role="tab"
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
