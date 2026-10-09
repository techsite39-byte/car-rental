"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import { DealCard } from "@/components/deals/DealCard";
import { deals as seedDeals } from "@/data/deals";
import { adminRepositories } from "@/lib/admin-data";
import { useAdminCollection } from "@/lib/use-admin-collection";

gsap.registerPlugin(ScrollTrigger);

export function DealsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const { items: managedDeals } = useAdminCollection(
    adminRepositories.deals,
    seedDeals.map((deal) => ({ ...deal, slug: deal.id, active: true })),
  );
  const deals = managedDeals.filter(({ active }) => active);

  const updateNavigation = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    setCanScrollPrevious(viewport.scrollLeft > 2);
    setCanScrollNext(maxScroll - viewport.scrollLeft > 2);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    if (!section || !viewport) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onResize = () => {
      updateNavigation();
      ScrollTrigger.refresh();
    };

    updateNavigation();
    const context = gsap.context(() => {
      if (mediaQuery.matches) return;

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
        .fromTo(
          "[data-deals-heading]",
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.7 },
        )
        .fromTo(
          "[data-deals-navigation]",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.52 },
          "-=0.38",
        )
        .fromTo(
          "[data-deal-card]",
          { autoAlpha: 0, y: 34 },
          { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.08 },
          "-=0.32",
        );
    }, section);

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      tweenRef.current?.kill();
      context.revert();
    };
  }, [updateNavigation]);

  const scrollByCard = useCallback(
    (direction: -1 | 1) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const firstCard = viewport.querySelector<HTMLElement>("[data-deal-card]");
      if (!firstCard) return;

      const track = viewport.querySelector<HTMLElement>(
        ".deals-carousel__track",
      );
      const styles = window.getComputedStyle(track ?? viewport);
      const gap = Number.parseFloat(styles.columnGap) || 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const target = gsap.utils.clamp(
        0,
        maxScroll,
        viewport.scrollLeft + step * direction,
      );

      tweenRef.current?.kill();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        viewport.scrollLeft = target;
        updateNavigation();
        return;
      }

      const scrollState = { value: viewport.scrollLeft };
      tweenRef.current = gsap.to(scrollState, {
        value: target,
        duration: 0.78,
        ease: "power3.out",
        onUpdate: () => {
          viewport.scrollLeft = scrollState.value;
        },
        onComplete: updateNavigation,
      });
    },
    [updateNavigation],
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByCard(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByCard(-1);
    }
  }

  return (
    <section
      aria-labelledby="deals-heading"
      className="deals-section"
      data-deals-section
      ref={sectionRef}
    >
      <div className="site-container">
        <div className="deals-section__header">
          <h2 className="deals-section__heading" data-deals-heading id="deals-heading">
            <span>Enjoy Extra Miles</span>
            <span>With Our Best Deals</span>
          </h2>

          <div
            aria-label="Deal carousel controls"
            className="deals-section__navigation"
            data-deals-navigation
          >
            <button
              aria-label="Previous deal"
              className="deals-section__arrow"
              disabled={!canScrollPrevious}
              onClick={() => scrollByCard(-1)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={19} strokeWidth={1.7} />
            </button>
            <button
              aria-label="Next deal"
              className="deals-section__arrow deals-section__arrow--next"
              disabled={!canScrollNext}
              onClick={() => scrollByCard(1)}
              type="button"
            >
              <ArrowRight aria-hidden="true" size={19} strokeWidth={1.7} />
            </button>
          </div>
        </div>

        <div
          aria-label="Best deals"
          aria-roledescription="carousel"
          className="deals-carousel"
          onKeyDown={handleKeyDown}
          onScroll={updateNavigation}
          ref={viewportRef}
          tabIndex={0}
        >
          <div className="deals-carousel__track">
            {deals.map((deal, index) => (
              <DealCard
                deal={deal}
                index={index}
                key={deal.id}
                total={deals.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
