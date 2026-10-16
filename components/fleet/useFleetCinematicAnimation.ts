"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 329;
const KEYFRAME_INTERVAL = 15;
const MOBILE_QUERY = "(max-width: 700px)";

function getFrameUrl(frame: number): string {
  return `/newsec/frame_${String(frame).padStart(3, "0")}.jpg`;
}

interface DrawParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CinematicScene {
  id: string;
  start: number;
  end: number;
  fadeIn: number;
  fadeOut: number;
  eyebrow: string;
  title: string;
  desc: string;
}

export const CINEMATIC_SCENES: CinematicScene[] = [
  {
    id: "cockpit",
    start: 0.02,
    end: 0.28,
    fadeIn: 0.04,
    fadeOut: 0.04,
    eyebrow: "01 — COCKPIT ARCHITECTURE",
    title: "DRIVER ORIENTATION",
    desc: "Sculpted M steering, live telemetry, and intuitive control engineered around the driver.",
  },
  {
    id: "exterior",
    start: 0.35,
    end: 0.65,
    fadeIn: 0.05,
    fadeOut: 0.05,
    eyebrow: "02 — SCULPTED CONTOURS",
    title: "AERODYNAMIC SILHOUETTE",
    desc: "Athletic proportions and low-slung stance crafted to slice through air with relentless poise.",
  },
  {
    id: "beauty",
    start: 0.72,
    end: 0.98,
    fadeIn: 0.05,
    fadeOut: 0.04,
    eyebrow: "03 — COMMAND THE ROAD",
    title: "UNCOMPROMISING STANCE",
    desc: "Twin laserlight optics, quad exhaust acoustic resonance, and supreme road presence.",
  },
];

export function useFleetCinematicAnimation() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  // Mutable refs: ZERO React re-renders during active scrolling
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
      { rootMargin: "100% 0px" },
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
    let latestScrollY = window.scrollY || window.pageYOffset || 0;
    let currentTargetFrame = 1;
    let lastTargetFrame = 1;
    let lastRequestedCenter = -1;

    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const isMobile = mobileQuery.matches;

    // Cache limits & prefetch windows
    const maxSlidingCacheSize = isMobile ? 40 : 80;
    const maxConcurrentLoads = isMobile ? 3 : 5;
    const prefetchAhead = isMobile ? 16 : 26;
    const prefetchBehind = isMobile ? 6 : 10;

    // Caches:
    // 1. Permanent keyframe spine (every 15th frame)
    const keyframeCache = new Map<number, HTMLImageElement>();
    // 2. Sliding window cache around user's scroll position
    const slidingCache = new Map<number, HTMLImageElement>();
    // 3. In-flight loads
    const inFlight = new Map<number, HTMLImageElement>();
    // 4. Queued requests
    const loadQueue: number[] = [];
    const queuedSet = new Set<number>();
    let activeLoads = 0;

    // Cached layout bounds
    let cachedStart = 0;
    let cachedDistance = 1;
    let drawParams: DrawParams = { x: 0, y: 0, width: 0, height: 0 };

    const overlay = overlayRef.current;
    const sceneElements = overlay
      ? Array.from(overlay.querySelectorAll<HTMLElement>("[data-scene-id]"))
      : [];

    function updateDimensions(rectWidth: number, rectHeight: number) {
      if (!canvas || rectWidth <= 0 || rectHeight <= 0 || disposed) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(rectWidth * dpr);
      const ch = Math.round(rectHeight * dpr);

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      // Exact aspect cover presentation matching 1280x720 source
      const scale = Math.max(cw / 1280, ch / 720);
      const dw = Math.round(1280 * scale);
      const dh = Math.round(720 * scale);
      const dx = Math.round((cw - dw) / 2);
      const dy = Math.round((ch - dh) / 2);

      drawParams = {
        x: dx,
        y: dy,
        width: dw,
        height: dh,
      };

      if (renderedFrameRef.current > 0) {
        drawFrame(renderedFrameRef.current);
      }
    }

    const initialBounds = canvas.getBoundingClientRect();
    updateDimensions(initialBounds.width, initialBounds.height);

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
        if (prev >= 1) {
          const pImg = getReadyImage(prev);
          if (pImg) return pImg;
        }
        const next = target + offset;
        if (next <= FRAME_COUNT) {
          const nImg = getReadyImage(next);
          if (nImg) return nImg;
        }
      }

      // Check boundary frames (transition between newsec and newsec1)
      if (target >= 205 && target <= 215) {
        const bImg = getReadyImage(210) || getReadyImage(211);
        if (bImg) return bImg;
      }

      // Nearest keyframe
      const nearestKf = Math.max(
        1,
        Math.min(FRAME_COUNT, Math.round(target / KEYFRAME_INTERVAL) * KEYFRAME_INTERVAL)
      );
      const kfImg = getReadyImage(nearestKf);
      if (kfImg) return kfImg;

      return getReadyImage(1) || getReadyImage(210) || getReadyImage(FRAME_COUNT);
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
        // Balanced mobile centering for cockpit & exterior beauty
        dx = Math.round((cw - dw) * 0.50);
      }

      ctx.drawImage(img, dx, y, dw, dh);
      renderedFrameRef.current = frameIndex;

      if (!isReadyRef.current) {
        isReadyRef.current = true;
        setIsReady(true);
      }
    }

    function trimSlidingCache(currentCenter: number) {
      if (slidingCache.size <= maxSlidingCacheSize) return;

      const entries = Array.from(slidingCache.keys());
      entries.sort((a, b) => Math.abs(b - currentCenter) - Math.abs(a - currentCenter));

      const removeCount = slidingCache.size - maxSlidingCacheSize;
      for (let i = 0; i < removeCount; i++) {
        const frameToRemove = entries[i];
        if (frameToRemove === 1 || frameToRemove === 210 || frameToRemove === FRAME_COUNT) {
          continue;
        }
        const img = slidingCache.get(frameToRemove);
        if (img) {
          img.src = "";
          slidingCache.delete(frameToRemove);
        }
      }
    }

    function processQueue() {
      if (disposed) return;

      while (activeLoads < maxConcurrentLoads && loadQueue.length > 0) {
        const frame = loadQueue.shift();
        if (!frame) break;
        queuedSet.delete(frame);

        if (slidingCache.has(frame) || keyframeCache.has(frame) || inFlight.has(frame)) {
          continue;
        }

        activeLoads++;
        const img = new Image();
        inFlight.set(frame, img);

        const onDone = () => {
          inFlight.delete(frame);
          activeLoads--;
          if (disposed) return;

          const isKeyframe = frame % KEYFRAME_INTERVAL === 0 || frame === 1 || frame === 210 || frame === FRAME_COUNT;
          if (isKeyframe) {
            keyframeCache.set(frame, img);
          } else {
            slidingCache.set(frame, img);
            trimSlidingCache(currentTargetFrame);
          }

          if (Math.abs(frame - currentTargetFrame) <= 1 && renderedFrameRef.current !== frame) {
            drawFrame(currentTargetFrame);
          }

          processQueue();
        };

        img.onload = () => {
          if (typeof img.decode === "function") {
            img.decode().then(onDone).catch(onDone);
          } else {
            onDone();
          }
        };

        img.onerror = () => {
          inFlight.delete(frame);
          activeLoads--;
          if (disposed) return;
          processQueue();
        };

        img.src = getFrameUrl(frame);
      }
    }

    function requestFramesAround(centerFrame: number, scrollDir: number) {
      if (centerFrame === lastRequestedCenter) return;
      lastRequestedCenter = centerFrame;

      const dir = scrollDir >= 0 ? 1 : -1;
      const ordered: number[] = [centerFrame];

      for (let i = 1; i <= prefetchAhead; i++) {
        const f = centerFrame + dir * i;
        if (f >= 1 && f <= FRAME_COUNT) ordered.push(f);
      }
      for (let i = 1; i <= prefetchBehind; i++) {
        const f = centerFrame - dir * i;
        if (f >= 1 && f <= FRAME_COUNT) ordered.push(f);
      }

      for (const f of ordered) {
        if (!slidingCache.has(f) && !keyframeCache.has(f) && !inFlight.has(f) && !queuedSet.has(f)) {
          queuedSet.add(f);
          loadQueue.unshift(f);
        }
      }

      processQueue();
    }

    // 1. Initial critical frames (1..20, 210, 329)
    for (let f = 1; f <= 20; f++) {
      queuedSet.add(f);
      loadQueue.push(f);
    }
    if (!queuedSet.has(210)) {
      queuedSet.add(210);
      loadQueue.push(210);
    }
    if (!queuedSet.has(FRAME_COUNT)) {
      queuedSet.add(FRAME_COUNT);
      loadQueue.push(FRAME_COUNT);
    }
    processQueue();

    // 2. Progressive background keyframe spine in batches
    const keyframes = Array.from(
      { length: Math.floor(FRAME_COUNT / KEYFRAME_INTERVAL) },
      (_, i) => (i + 1) * KEYFRAME_INTERVAL
    );

    const timeouts: NodeJS.Timeout[] = [];
    const batchSize = 6;
    for (let i = 0; i < keyframes.length; i += batchSize) {
      const batch = keyframes.slice(i, i + batchSize);
      const batchIndex = Math.floor(i / batchSize);
      const t = setTimeout(() => {
        if (disposed) return;
        for (const kf of batch) {
          if (!keyframeCache.has(kf) && !queuedSet.has(kf) && !slidingCache.has(kf)) {
            queuedSet.add(kf);
            loadQueue.push(kf);
          }
        }
        processQueue();
      }, 150 + batchIndex * 250);
      timeouts.push(t);
    }

    // =========================================================================
    // Passive Scroll Listener + RequestAnimationFrame
    // =========================================================================
    function updateCinematic() {
      ticking = false;
      if (disposed) return;

      const scrollOffset = latestScrollY - cachedStart;
      const progress = Math.max(0, Math.min(1, scrollOffset / cachedDistance));

      const targetFrame = Math.min(
        FRAME_COUNT,
        Math.max(1, Math.round(1 + progress * (FRAME_COUNT - 1)))
      );

      currentTargetFrame = targetFrame;
      const scrollDir = targetFrame >= lastTargetFrame ? 1 : -1;
      lastTargetFrame = targetFrame;

      requestFramesAround(targetFrame, scrollDir);

      if (targetFrame !== renderedFrameRef.current) {
        drawFrame(targetFrame);
      }

      // Overlay text scenes
      if (sceneElements.length > 0) {
        for (let i = 0; i < CINEMATIC_SCENES.length; i++) {
          const scene = CINEMATIC_SCENES[i];
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
              el.style.transform = "translate3d(0, 16px, 0)";
              el.style.visibility = "hidden";
            }
          } else {
            el.dataset.active = "true";
            const ease = factor * factor * (3 - 2 * factor);
            const translateY = (1 - ease) * 16;
            el.style.opacity = ease.toFixed(3);
            el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
            el.style.visibility = "visible";
          }
        }
      }
    }

    function onScroll() {
      latestScrollY = window.scrollY || window.pageYOffset || 0;
      if (!ticking) {
        ticking = true;
        rafId = requestAnimationFrame(updateCinematic);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    // GSAP ScrollTrigger Pinning
    ScrollTrigger.config({ ignoreMobileResize: true });

    const scrollDistance = window.innerHeight * (isMobile ? 2.8 : 3.6);

    let ctxGsap: gsap.Context | undefined;
    let layoutObserver: MutationObserver | undefined;

    const createTrigger = () => {
      if (ctxGsap || disposed) return;

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
              rafId = requestAnimationFrame(updateCinematic);
            }
          },
        });

        cachedStart = trigger.start;
        cachedDistance = Math.max(1, trigger.end - trigger.start);
      }, section);

      if (!ticking && !disposed) {
        ticking = true;
        rafId = requestAnimationFrame(updateCinematic);
      }
    };

    const precedingPinnedSections = Array.from(
      section.parentElement?.querySelectorAll<HTMLElement>(
        ".frame-sequence, .section2-sequence, .open-road-steps",
      ) ?? [],
    ).filter(
      (candidate) =>
        candidate.compareDocumentPosition(section) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const arePrecedingSectionsPinned = () =>
      precedingPinnedSections.every((candidate) =>
        candidate.parentElement?.classList.contains("pin-spacer"),
      );

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      arePrecedingSectionsPinned()
    ) {
      createTrigger();
    } else if (section.parentElement) {
      layoutObserver = new MutationObserver(() => {
        if (!arePrecedingSectionsPinned()) return;

        layoutObserver?.disconnect();
        createTrigger();
      });
      layoutObserver.observe(section.parentElement, { childList: true });
    }

    updateCinematic();

    function handleResize() {
      if (disposed) return;
      const rect = canvas ? canvas.getBoundingClientRect() : null;
      if (rect) {
        updateDimensions(rect.width, rect.height);
      }
      updateCinematic();
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
      timeouts.forEach((t) => clearTimeout(t));
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      resizeObserver.disconnect();

      layoutObserver?.disconnect();
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
