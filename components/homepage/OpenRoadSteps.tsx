"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import "./open-road-steps.css";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    number: "01",
    title: "Choose your car",
    description:
      "Compare the listed cars by category, seating and fuel type.",
  },
  {
    number: "02",
    title: "Send a booking request",
    description:
      "Share your preferred locations, dates, times and contact details.",
  },
  {
    number: "03",
    title: "Confirm your journey",
    description:
      "Our team will follow up to confirm availability, pickup arrangements and final details.",
  },
] as const;

const SCROLL_POSITION_KEY = "open-road-steps-scroll-position";

export function OpenRoadSteps() {
  const sectionRef = useRef<HTMLElement>(null);
  const savedScrollY = useRef<number | null>(null);
  const didReadScrollPosition = useRef(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (!didReadScrollPosition.current) {
      didReadScrollPosition.current = true;
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming | undefined;
      if (navigation?.type === "reload") {
        const storedScrollY = sessionStorage.getItem(SCROLL_POSITION_KEY);
        if (storedScrollY !== null) {
          const parsedScrollY = Number(storedScrollY);
          if (Number.isFinite(parsedScrollY) && parsedScrollY >= 0) {
            savedScrollY.current = parsedScrollY;
          }
        }
      }
      sessionStorage.removeItem(SCROLL_POSITION_KEY);
    }

    const track = section.querySelector<HTMLElement>(
      "[data-open-road-track]",
    );
    const fill = section.querySelector<HTMLElement>("[data-open-road-fill]");
    const indicator = section.querySelector<HTMLElement>(
      "[data-open-road-indicator]",
    );
    const progressBar = section.querySelector<HTMLElement>(
      "[data-open-road-progress]",
    );
    const cards = Array.from(
      section.querySelectorAll<HTMLElement>("[data-open-road-card]"),
    );
    if (!track || !fill || !indicator || !progressBar || cards.length !== 3) {
      throw new Error("The open-road steps section is missing required elements.");
    }

    const saveScrollPosition = () => {
      sessionStorage.setItem(SCROLL_POSITION_KEY, String(window.scrollY));
    };

    const setFill = gsap.quickSetter(fill, "scaleX");
    let trackWidth = track.getBoundingClientRect().width;
    const trackResizeObserver = new ResizeObserver(([entry]) => {
      if (entry) trackWidth = entry.contentRect.width;
    });
    trackResizeObserver.observe(track);
    const setIndicator = gsap.quickSetter(indicator, "x", "px");
    const updateProgress = (progress: number) => {
      const clampedProgress = gsap.utils.clamp(0, 1, progress);
      const activeIndex = Math.min(
        cards.length - 1,
        Math.floor(clampedProgress * cards.length),
      );

      setFill(clampedProgress);
      setIndicator(clampedProgress * trackWidth);
      progressBar.setAttribute(
        "aria-valuenow",
        String(Math.round(clampedProgress * 100)),
      );

      cards.forEach((card, index) => {
        const isActive = index === activeIndex;
        card.classList.toggle("open-road-steps__card--active", isActive);
        if (isActive) {
          card.setAttribute("aria-current", "step");
        } else {
          card.removeAttribute("aria-current");
        }
      });
    };

    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (isReducedMotion) {
      updateProgress(0);
      return;
    }
    window.addEventListener("pagehide", saveScrollPosition);

    let context: gsap.Context | undefined;
    let sequenceLayoutObserver: MutationObserver | undefined;
    let refreshFrame: number | undefined;
    const refresh = () => {
      if (refreshFrame !== undefined) {
        window.cancelAnimationFrame(refreshFrame);
      }
      refreshFrame = window.requestAnimationFrame(() =>
        ScrollTrigger.refresh(),
      );
    };
    const createTrigger = () => {
      if (context) return;

      context = gsap.context(() => {
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * 2}`,
          pin: section,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => updateProgress(self.progress),
          onRefresh: (self) => updateProgress(self.progress),
        });

        updateProgress(trigger.progress);
      }, section);
      if (savedScrollY.current !== null) {
        if (refreshFrame !== undefined) {
          window.cancelAnimationFrame(refreshFrame);
        }
        refreshFrame = window.requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          window.scrollTo(0, savedScrollY.current ?? 0);
          ScrollTrigger.update();
          savedScrollY.current = null;
        });
      } else {
        refresh();
      }
    };
    const precedingSequences = Array.from(
      section.parentElement?.querySelectorAll<HTMLElement>(
        ".frame-sequence, .section2-sequence",
      ) ?? [],
    ).filter(
      (sequence) =>
        sequence.compareDocumentPosition(section) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const arePrecedingSequencesPinned = () =>
      precedingSequences.every((sequence) =>
        sequence.parentElement?.classList.contains("pin-spacer"),
      );

    if (arePrecedingSequencesPinned()) {
      createTrigger();
    } else if (section.parentElement) {
      sequenceLayoutObserver = new MutationObserver(() => {
        if (!arePrecedingSequencesPinned()) return;

        sequenceLayoutObserver?.disconnect();
        createTrigger();
      });
      sequenceLayoutObserver.observe(section.parentElement, {
        childList: true,
      });
    }

    const refreshAfterPageRestore = () => {
      refresh();
    };
    window.addEventListener("pageshow", refreshAfterPageRestore);

    return () => {
      if (refreshFrame !== undefined) {
        window.cancelAnimationFrame(refreshFrame);
      }
      window.removeEventListener("pageshow", refreshAfterPageRestore);
      window.removeEventListener("pagehide", saveScrollPosition);
      sequenceLayoutObserver?.disconnect();
      trackResizeObserver.disconnect();
      context?.revert();
    };
  }, []);

  return (
    <section
      aria-labelledby="open-road-steps-heading"
      className="open-road-steps"
      ref={sectionRef}
    >
      <div className="site-container">
        <header className="open-road-steps__header">
          <h2 id="open-road-steps-heading">
            Three steps to the open road
          </h2>
          <p>
            Choose a vehicle and share a few trip details. Our Madurai team will
            follow up to confirm the arrangement.
          </p>
        </header>

        <div
          aria-label="Progress through the three booking steps"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={0}
          className="open-road-steps__progress"
          data-open-road-progress
          role="progressbar"
        >
          <div className="open-road-steps__track" data-open-road-track>
            <span
              aria-hidden="true"
              className="open-road-steps__fill"
              data-open-road-fill
            />
            <span
              aria-hidden="true"
              className="open-road-steps__indicator"
              data-open-road-indicator
            />
          </div>
        </div>

        <ol className="open-road-steps__cards">
          {STEPS.map((step, index) => (
            <li
              aria-current={index === 0 ? "step" : undefined}
              className={`open-road-steps__card${index === 0 ? " open-road-steps__card--active" : ""}`}
              data-open-road-card
              key={step.number}
            >
              <span className="open-road-steps__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
