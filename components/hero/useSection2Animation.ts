"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 750;
const KEYFRAME_INTERVAL = 25;
const MOBILE_QUERY = "(max-width: 700px)";

function getFrameUrl(frame: number): string {
  return `/section2/frame_${String(frame).padStart(3, "0")}.jpg`;
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
  const [isReady, setIsReady] = useState(false);

  // Mutable refs: ZERO React re-renders during scrolling
  const renderedFrameRef = useRef(-1);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

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

    // Cache sizing and load limits
    const maxSlidingCacheSize = isMobile ? 45 : 90;
    const maxConcurrentLoads = isMobile ? 3 : 5;
    const prefetchAhead = isMobile ? 18 : 28;
    const prefetchBehind = isMobile ? 6 : 10;

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

    function updateDimensions(rectWidth: number, rectHeight: number) {
      if (!canvas || rectWidth <= 0 || rectHeight <= 0 || disposed) return;

      const isMob = mobileQuery.matches;
      // Cap DPR to avoid excessive GPU memory fillrate on mobile high-DPI screens
      const dpr = Math.min(window.devicePixelRatio || 1, isMob ? 1.25 : 1.5);
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

    // Measure initial layout
    const initialBounds = canvas.getBoundingClientRect();
    updateDimensions(initialBounds.width, initialBounds.height);

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

      // Check nearest keyframe
      const nearestKf = Math.max(
        1,
        Math.min(FRAME_COUNT, Math.round(target / KEYFRAME_INTERVAL) * KEYFRAME_INTERVAL)
      );
      const kfImg = getReadyImage(nearestKf);
      if (kfImg) return kfImg;

      // Safe fallbacks to prevent any black/blank frame
      return getReadyImage(1) || getReadyImage(FRAME_COUNT);
    }

    function drawFrame(frameIndex: number) {
      if (!ctx || disposed) return;

      const img = findNearestLoadedFrame(frameIndex);
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const { x, y, width: dw, height: dh } = drawParams;
      if (dw <= 0 || dh <= 0) return;

      ctx.drawImage(img, x, y, dw, dh);
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
      if (disposed) return;

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
              frame % KEYFRAME_INTERVAL === 0 || frame === 1 || frame === FRAME_COUNT;

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

        img.src = getFrameUrl(frame);
      }
    }

    function requestFramesAround(centerFrame: number, scrollDir: number) {
      if (centerFrame === lastRequestedCenter && loadQueue.length > 0) return;
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

      // Purge requests from queue that are now far from current target (> 40 frames away)
      if (loadQueue.length > 30) {
        for (let i = loadQueue.length - 1; i >= 0; i--) {
          const queued = loadQueue[i];
          if (Math.abs(queued - centerFrame) > 40) {
            queuedSet.delete(queued);
            loadQueue.splice(i, 1);
          }
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

    // 1. Immediately request initial frames (1..15) and final frame
    for (let f = 1; f <= 15; f++) {
      queuedSet.add(f);
      loadQueue.push(f);
    }
    if (!queuedSet.has(FRAME_COUNT)) {
      queuedSet.add(FRAME_COUNT);
      loadQueue.push(FRAME_COUNT);
    }
    processQueue();

    // 2. Progressive background keyframe spine in small batches
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
    // ONE Passive Scroll Listener + ONE RequestAnimationFrame Pipeline
    // =========================================================================
    function updateSection2() {
      ticking = false;
      if (disposed) return;

      // 1. Calculate progress from latest scroll position and cached dimensions (0 to 1)
      const scrollOffset = latestScrollY - cachedStart;
      const progress = Math.max(0, Math.min(1, scrollOffset / cachedDistance));

      // 2. Numerical mapping directly from progress to frame [1 .. FRAME_COUNT]
      const targetFrame = Math.min(
        FRAME_COUNT,
        Math.max(1, Math.round(1 + progress * (FRAME_COUNT - 1)))
      );

      currentTargetFrame = targetFrame;
      const scrollDir = targetFrame >= lastTargetFrame ? 1 : -1;
      lastTargetFrame = targetFrame;

      // 3. Request prefetching around target
      requestFramesAround(targetFrame, scrollDir);

      // 4. Draw frame if changed
      if (targetFrame !== renderedFrameRef.current) {
        drawFrame(targetFrame);
      }
    }

    function onScroll() {
      latestScrollY = window.scrollY || window.pageYOffset || 0;
      if (!ticking) {
        ticking = true;
        rafId = requestAnimationFrame(updateSection2);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    // =========================================================================
    // GSAP Context with ScrollTrigger Pinning
    // =========================================================================
    ScrollTrigger.config({ ignoreMobileResize: true });

    const scrollDistance = window.innerHeight * (isMobile ? 3.0 : 4.2);

    const ctxGsap = gsap.context(() => {
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
      timeouts.forEach((t) => clearTimeout(t));
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      resizeObserver.disconnect();

      // Cleanly revert GSAP DOM modifications before React reconciliation
      ctxGsap.revert();

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
  }, []);

  return { sectionRef, canvasRef, fallbackRef, isReady };
}
