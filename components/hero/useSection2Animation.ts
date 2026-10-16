"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { SECTION2_TEXT_SCENES } from "@/components/hero/section2TextScenes";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 337;
const LAST_FRAME_INDEX = FRAME_COUNT - 1;
const SOURCE_WIDTH = 3840;
const SOURCE_HEIGHT = 2160;
const KEYFRAME_INTERVAL = 15;
const MOBILE_QUERY = "(max-width: 700px)";

function getFrameUrl(frame: number, directory: "Second" | "Second-mobile"): string {
  return `/${directory}/Untitled${String(108000 + frame).padStart(8, "0")}.jpg`;
}

interface DrawParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useSection2Animation() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  // Mutable refs: ZERO React re-renders during scrolling
  const renderedFrameRef = useRef(-1);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -2px 0px" },
    );
    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas || !hasEnteredViewport) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let disposed = false;
    let ticking = false;
    let rafId = 0;
    let isVisible = false;
    let latestScrollY = window.scrollY || window.pageYOffset || 0;
    let currentTargetFrame = 0;
    let lastTargetFrame = 0;
    let lastRequestedCenter = -1;

    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isMobile = mobileQuery.matches;
    const frameDirectory = isMobile ? "Second-mobile" : "Second";
    const sourceWidth = isMobile ? 1280 : SOURCE_WIDTH;
    const sourceHeight = isMobile ? 720 : SOURCE_HEIGHT;

    // Cache sizing and load limits
    // 4K decoded bitmaps are expensive; keep a small smooth-scroll window.
    const maxSlidingCacheSize = isMobile ? 24 : 48;
    const maxConcurrentLoads = isMobile ? 2 : 4;
    const prefetchAhead = isMobile ? 8 : 12;
    const prefetchBehind = isMobile ? 3 : 5;

    // Caches:
    // 1. Permanent keyframe spine (every 25th frame: ~31 frames total)
    const keyframeCache = new Map<number, HTMLImageElement>();
    // 2. Sliding window cache for smooth sequential scrubbing
    const slidingCache = new Map<number, HTMLImageElement>();
    // 3. In-flight loads
    const inFlight = new Map<number, HTMLImageElement>();
    // 4. Queued frame requests
    const loadQueue: number[] = [];
    const queuedSet = new Set<number>();
    let activeLoads = 0;

    // Cached layout measurements (updated ONLY on refresh/resize, NOT in scroll loop)
    let cachedStart = 0;
    let cachedDistance = 1;

    let drawParams: DrawParams = { x: 0, y: 0, width: 0, height: 0 };

    // Cache text overlay DOM nodes
    const overlay = overlayRef.current;
    const sceneElements = overlay
      ? Array.from(overlay.querySelectorAll<HTMLElement>("[data-text-scene]"))
      : [];

    function updateDimensions(rectWidth: number, rectHeight: number) {
      if (!canvas || rectWidth <= 0 || rectHeight <= 0 || disposed) return;

      // Keep the backing store sharp without exceeding a bounded GPU memory budget.
      const pixelBudgetDpr = Math.sqrt(
        (isMobile ? 2_500_000 : 6_000_000) / (rectWidth * rectHeight),
      );
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        isMobile ? 2 : 3,
        pixelBudgetDpr,
      );
      const cw = Math.round(rectWidth * dpr);
      const ch = Math.round(rectHeight * dpr);

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      // Exact aspect-cover presentation matching the selected source set.
      const scale = Math.max(cw / sourceWidth, ch / sourceHeight);
      const dw = Math.round(sourceWidth * scale);
      const dh = Math.round(sourceHeight * scale);
      const dx = Math.round((cw - dw) / 2);
      const dy = Math.round((ch - dh) / 2);

      drawParams = {
        x: dx,
        y: dy,
        width: dw,
        height: dh,
      };

      if (renderedFrameRef.current >= 0) {
        drawFrame(renderedFrameRef.current);
      }
    }

    // Measure initial layout
    const initialBounds = canvas.getBoundingClientRect();
    updateDimensions(initialBounds.width, initialBounds.height);

    let dprMediaQuery = window.matchMedia(
      `(resolution: ${window.devicePixelRatio || 1}dppx)`,
    );
    const handleDprChange = () => {
      dprMediaQuery.removeEventListener("change", handleDprChange);
      const rect = canvas.getBoundingClientRect();
      updateDimensions(rect.width, rect.height);
      dprMediaQuery = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`,
      );
      dprMediaQuery.addEventListener("change", handleDprChange, { once: true });
    };
    dprMediaQuery.addEventListener("change", handleDprChange, { once: true });

    // =========================================================================
    // Fast O(1) Frame Drawing with Intelligent Nearest Fallback
    // =========================================================================
    function getReadyImage(frame: number): HTMLImageElement | null {
      const img = slidingCache.get(frame) || keyframeCache.get(frame);
      if (img && img.complete && img.naturalWidth > 0) return img;
      return null;
    }

    function findNearestLoadedFrame(target: number): HTMLImageElement | null {
      const exact = getReadyImage(target);
      if (exact) return exact;

      // Search outward up to 25 frames for the nearest loaded frame
      for (let offset = 1; offset <= 25; offset++) {
        const prev = target - offset;
        if (prev >= 0) {
          const pImg = getReadyImage(prev);
          if (pImg) return pImg;
        }
        const next = target + offset;
        if (next <= LAST_FRAME_INDEX) {
          const nImg = getReadyImage(next);
          if (nImg) return nImg;
        }
      }

      // Check sequence boundary frames if nearby
      if (target >= 265 && target <= 275) {
        const bImg = getReadyImage(270) || getReadyImage(271);
        if (bImg) return bImg;
      }

      // Check nearest keyframe
      const nearestKf = Math.max(
        0,
        Math.min(LAST_FRAME_INDEX, Math.round(target / KEYFRAME_INTERVAL) * KEYFRAME_INTERVAL)
      );
      const kfImg = getReadyImage(nearestKf);
      if (kfImg) return kfImg;

      // Safe fallbacks to prevent any black/blank frame
      return getReadyImage(0) || getReadyImage(LAST_FRAME_INDEX);
    }

    function drawFrame(frameIndex: number) {
      if (!ctx || !canvas || disposed) return;

      const img = findNearestLoadedFrame(frameIndex);
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const { y, width: dw, height: dh } = drawParams;
      if (dw <= 0 || dh <= 0) return;

      const cw = canvas.width;
      const ch = canvas.height;
      let dx = drawParams.x;
      const aspect = (canvas.clientWidth || cw) / (canvas.clientHeight || ch);
      if (aspect < 1.2 && cw > 0 && dw > 0) {
        // Dynamic mobile focal alignment:
        // Early frames (exterior): 0.52
        // Later frames (interior cockpit push): smoothly move towards 0.60
        const p = frameIndex / LAST_FRAME_INDEX;
        const mobileAlignX = p <= 0.64 ? 0.52 : 0.52 + (p - 0.64) * (0.08 / 0.36);
        dx = Math.round((cw - dw) * mobileAlignX);
      }

      ctx.drawImage(img, dx, y, dw, dh);
      renderedFrameRef.current = frameIndex;

      if (!isReadyRef.current) {
        isReadyRef.current = true;
        setIsReady(true);
      }
    }

    // =========================================================================
    // Memory-Bounded Cache Manager & Async Decode Pipeline
    // =========================================================================
    function trimCache(currentCenter: number) {
      // Hysteresis: only trim when cache exceeds limit by threshold to avoid frequent sorting
      if (slidingCache.size <= maxSlidingCacheSize + 10) return;

      const keys = Array.from(slidingCache.keys());
      keys.sort((a, b) => Math.abs(b - currentCenter) - Math.abs(a - currentCenter));

      const removeCount = slidingCache.size - maxSlidingCacheSize;
      for (let i = 0; i < removeCount; i++) {
        const frameToRemove = keys[i];
        const oldImg = slidingCache.get(frameToRemove);
        if (oldImg) {
          oldImg.src = ""; // Force browser to immediately release GPU bitmap memory
          slidingCache.delete(frameToRemove);
        }
      }
    }

    function processQueue() {
      if (disposed || !isVisible || document.hidden) return;

      while (activeLoads < maxConcurrentLoads && loadQueue.length > 0) {
        const frame = loadQueue.shift();
        if (frame === undefined) break;
        queuedSet.delete(frame);

        if (slidingCache.has(frame) || keyframeCache.has(frame) || inFlight.has(frame)) {
          continue;
        }

        const img = new Image();
        img.decoding = "async";
        inFlight.set(frame, img);
        activeLoads++;

        const onFrameLoaded = () => {
          inFlight.delete(frame);
          activeLoads--;
          if (disposed) return;

          if (img.naturalWidth > 0) {
            const isKeyframe =
              frame % KEYFRAME_INTERVAL === 0 ||
              frame === 0 ||
              frame === LAST_FRAME_INDEX;

            if (isKeyframe) {
              keyframeCache.set(frame, img);
            } else {
              slidingCache.set(frame, img);
              trimCache(currentTargetFrame);
            }

            // If the newly ready frame is what the user is actively viewing, re-render
            if (
              Math.abs(frame - currentTargetFrame) <= 2 &&
              renderedFrameRef.current !== currentTargetFrame
            ) {
              if (!ticking) {
                ticking = true;
                rafId = requestAnimationFrame(updateSection2);
              }
            }
          }

          processQueue();
        };

        img.onload = () => {
          // Off-main-thread image decoding prevents main-thread draw stalls
          if ("decode" in img) {
            img.decode().then(onFrameLoaded).catch(onFrameLoaded);
          } else {
            onFrameLoaded();
          }
        };

        img.onerror = () => {
          inFlight.delete(frame);
          activeLoads--;
          if (disposed) return;
          processQueue();
        };

        img.src = getFrameUrl(frame, frameDirectory);
      }
    }

    function requestFramesAround(centerFrame: number, scrollDir: number) {
      if (reducedMotionQuery.matches) return;
      if (centerFrame === lastRequestedCenter && loadQueue.length > 0) return;
      lastRequestedCenter = centerFrame;

      const dir = scrollDir >= 0 ? 1 : -1;
      const ordered: number[] = [centerFrame];

      for (let i = 1; i <= prefetchAhead; i++) {
        const f = centerFrame + dir * i;
        if (f >= 0 && f <= LAST_FRAME_INDEX) ordered.push(f);
      }
      for (let i = 1; i <= prefetchBehind; i++) {
        const f = centerFrame - dir * i;
        if (f >= 0 && f <= LAST_FRAME_INDEX) ordered.push(f);
      }

      // Deprioritize obsolete queued work whenever the scroll direction/target changes.
      // In-flight images are allowed to finish so their decodes are not interrupted mid-flight.
      for (let i = loadQueue.length - 1; i >= 0; i--) {
        const queued = loadQueue[i];
        if (Math.abs(queued - centerFrame) > 40) {
          queuedSet.delete(queued);
          loadQueue.splice(i, 1);
        }
      }

      // Insert high-priority frames at the front of loadQueue
      for (let i = ordered.length - 1; i >= 0; i--) {
        const f = ordered[i];
        if (
          !slidingCache.has(f) &&
          !keyframeCache.has(f) &&
          !inFlight.has(f) &&
          !queuedSet.has(f)
        ) {
          queuedSet.add(f);
          loadQueue.unshift(f);
        }
      }

      processQueue();
    }

    // =========================================================================
    // Initial Load & Background Keyframe Spine
    // =========================================================================

    // Sequence frames are requested only around the current scroll position.

    // =========================================================================
    // ONE Passive Scroll Listener + ONE RequestAnimationFrame Pipeline
    // =========================================================================
    function updateSection2() {
      ticking = false;
      if (disposed || !isVisible || document.hidden) return;

      // 1. Calculate progress from latest scroll position and cached dimensions (0 to 1)
      const scrollOffset = latestScrollY - cachedStart;
      const progress = Math.max(0, Math.min(1, scrollOffset / cachedDistance));

      // 2. Numerical mapping directly from progress to frame [0 .. 336].
      const targetFrame = reducedMotionQuery.matches
        ? 0
        : Math.min(
            LAST_FRAME_INDEX,
            Math.max(0, Math.round(progress * LAST_FRAME_INDEX)),
          );

      currentTargetFrame = targetFrame;
      const scrollDir = targetFrame >= lastTargetFrame ? 1 : -1;
      lastTargetFrame = targetFrame;

      // 3. Request prefetching around target
      if (!reducedMotionQuery.matches) {
        requestFramesAround(targetFrame, scrollDir);
      }

      // 4. Draw frame if changed
      if (!reducedMotionQuery.matches && targetFrame !== renderedFrameRef.current) {
        drawFrame(targetFrame);
      }

      // 5. Update cinematic text overlay moments with zero React re-render overhead
      if (sceneElements.length > 0) {
        for (let i = 0; i < SECTION2_TEXT_SCENES.length; i++) {
          const scene = SECTION2_TEXT_SCENES[i];
          const el = sceneElements[i];
          if (!el) continue;

          let factor = 0;
          if (progress >= scene.start && progress <= scene.end) {
            if (progress < scene.start + scene.fadeIn) {
              factor = (progress - scene.start) / scene.fadeIn;
            } else if (progress > scene.end - scene.fadeOut) {
              factor = (scene.end - progress) / scene.fadeOut;
            } else {
              factor = 1;
            }
          }

          if (factor <= 0.001) {
            if (el.dataset.active === "true") {
              el.dataset.active = "false";
              el.style.opacity = "0";
              el.style.transform = "translate3d(0, 18px, 0)";
              el.style.visibility = "hidden";
              el.style.pointerEvents = "none";
            }
          } else {
            el.dataset.active = "true";
            // Smooth cubic ease: 3x^2 - 2x^3
            const ease = factor * factor * (3 - 2 * factor);
            const translateY = (1 - ease) * 18;
            el.style.opacity = ease.toFixed(3);
            el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
            el.style.visibility = "visible";

            if (scene.ctaText) {
              const cta = el.querySelector<HTMLElement>(".section2-text__cta");
              if (cta) {
                cta.style.pointerEvents = ease > 0.6 ? "auto" : "none";
              }
            }
          }
        }
      }
    }

    function onScroll() {
      latestScrollY = window.scrollY || window.pageYOffset || 0;
      if (!isVisible || document.hidden) return;
      if (!ticking) {
        ticking = true;
        rafId = requestAnimationFrame(updateSection2);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting);
        if (isVisible) {
          processQueue();
          updateSection2();
        } else {
          ticking = false;
          cancelAnimationFrame(rafId);
        }
      },
      { rootMargin: "100% 0px" },
    );
    visibilityObserver.observe(section);

    const handleDocumentVisibility = () => {
      if (document.hidden) {
        ticking = false;
        cancelAnimationFrame(rafId);
      } else if (isVisible) {
        processQueue();
        updateSection2();
      }
    };
    document.addEventListener("visibilitychange", handleDocumentVisibility);

    // =========================================================================
    // GSAP Context with ScrollTrigger Pinning
    // =========================================================================
    ScrollTrigger.config({ ignoreMobileResize: true });

    const scrollDistance = window.innerHeight * (isMobile ? 3.0 : 4.2);

    let ctxGsap: gsap.Context | undefined;
    if (reducedMotionQuery.matches) {
      cachedStart = section.getBoundingClientRect().top + latestScrollY;
      cachedDistance = Math.max(1, section.clientHeight);
    } else {
      ctxGsap = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${scrollDistance}`,
        pin: section,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          cachedStart = self.start;
          cachedDistance = Math.max(1, self.end - self.start);
          if (!ticking && !disposed) {
            ticking = true;
            rafId = requestAnimationFrame(updateSection2);
          }
        },
      });

      cachedStart = trigger.start;
      cachedDistance = Math.max(1, trigger.end - trigger.start);
      }, section);
    }

    // Initial draw
    updateSection2();

    function handleResize() {
      if (disposed) return;
      const rect = canvas ? canvas.getBoundingClientRect() : null;
      if (rect) {
        updateDimensions(rect.width, rect.height);
      }
      updateSection2();
    }

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry && !disposed) {
        updateDimensions(entry.contentRect.width, entry.contentRect.height);
      }
    });
    resizeObserver.observe(canvas);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", handleDocumentVisibility);
      dprMediaQuery.removeEventListener("change", handleDprChange);

      // Cleanly revert GSAP DOM modifications before React reconciliation
      ctxGsap?.revert();

      for (const img of inFlight.values()) {
        img.src = "";
      }
      inFlight.clear();

      for (const img of slidingCache.values()) {
        img.src = "";
      }
      slidingCache.clear();

      for (const img of keyframeCache.values()) {
        img.src = "";
      }
      keyframeCache.clear();

      loadQueue.length = 0;
      queuedSet.clear();
    };
  }, [hasEnteredViewport]);

  return { sectionRef, canvasRef, fallbackRef, overlayRef, isReady };
}
