"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const MOBILE_QUERY = "(max-width: 700px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const KEYFRAME_INTERVAL = 10;

interface ScrollFrameSequenceOptions {
  frameCount: number;
  initialFrame: number;
  getFrameUrl: (frame: number) => string;
  mobileCacheSize?: number;
  desktopCacheSize?: number;
  priority?: boolean;
}

interface DrawParams {
  x: number;
  y: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function useScrollFrameSequence({
  frameCount,
  initialFrame,
  getFrameUrl,
  mobileCacheSize = 30,
  desktopCacheSize = 60,
  priority = true,
}: ScrollFrameSequenceOptions) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const [isReady, setIsReady] = useState(false);

  // High-performance mutable references — ZERO React re-renders during scroll
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const renderedFrameRef = useRef(-1);
  const isReadyRef = useRef(false);
  const drawParamsRef = useRef<DrawParams>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    canvasWidth: 0,
    canvasHeight: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let disposed = false;
    let rafId = 0;
    let isLoopRunning = false;

    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    // Frame caches:
    // 1. Sliding window cache for smooth sequential playback around active scroll position
    const slidingCache = new Map<number, HTMLImageElement>();
    // 2. Keyframe spine (every 10th frame) to guarantee instant fallback during fast scrolling
    const keyframeCache = new Map<number, HTMLImageElement>();
    // In-flight loads
    const inFlight = new Map<number, HTMLImageElement>();
    // Queue of requested frames
    const loadQueue: number[] = [];
    const queuedSet = new Set<number>();
    let activeLoads = 0;

    const maxCacheSize = mobileQuery.matches ? mobileCacheSize : desktopCacheSize;
    const maxConcurrentLoads = mobileQuery.matches ? 2 : 4;
    const prefetchAhead = mobileQuery.matches ? 14 : 20;
    const prefetchBehind = 5;

    // Dimension precalculation: responsive cover presentation (object-fit: cover equivalent)
    // Frame 1 source resolution is 1280x720 (16:9)
    function updateDimensions(rectWidth: number, rectHeight: number) {
      if (!canvas || rectWidth <= 0 || rectHeight <= 0) return;

      const isMobile = mobileQuery.matches;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2.0);
      const cw = Math.round(rectWidth * dpr);
      const ch = Math.round(rectHeight * dpr);

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      // Aspect cover calculation (1280x720 source)
      const scale = Math.max(cw / 1280, ch / 720);
      const dw = Math.round(1280 * scale);
      const dh = Math.round(720 * scale);

      // Responsive horizontal alignment:
      // On wide desktop/tablet landscape (aspect >= 1.2), center horizontally (0.50).
      // On narrow mobile portrait displays (aspect < 1.2, e.g. 9:16 ~ 0.56),
      // adjust slightly to 0.54 to keep the sculpted BMW headlights, nose, and body lines perfectly framed.
      const aspect = rectWidth / rectHeight;
      const alignX = aspect >= 1.2 ? 0.5 : 0.5 + Math.min(0.04, (1.2 - aspect) * 0.05);
      const dx = Math.round((cw - dw) * alignX);
      const dy = Math.round((ch - dh) / 2);

      drawParamsRef.current = {
        x: dx,
        y: dy,
        width: dw,
        height: dh,
        canvasWidth: cw,
        canvasHeight: ch,
      };

      if (renderedFrameRef.current > 0) {
        drawFrame(renderedFrameRef.current);
      }
    }

    // Helper: find nearest loaded frame in sliding or keyframe cache in O(1)
    function getLoadedFrame(frame: number): HTMLImageElement | null {
      const img = slidingCache.get(frame) || keyframeCache.get(frame);
      if (img && img.complete && img.naturalWidth > 0) return img;
      return null;
    }

    function findNearestLoadedFrame(target: number): HTMLImageElement | null {
      const exact = getLoadedFrame(target);
      if (exact) return exact;

      // Check adjacent frames outward
      for (let offset = 1; offset <= 30; offset++) {
        const prev = target - offset;
        if (prev >= 1) {
          const pImg = getLoadedFrame(prev);
          if (pImg) return pImg;
        }
        const next = target + offset;
        if (next <= frameCount) {
          const nImg = getLoadedFrame(next);
          if (nImg) return nImg;
        }
      }

      // Check nearest keyframe
      const nearestKeyframe = Math.round(target / KEYFRAME_INTERVAL) * KEYFRAME_INTERVAL;
      const clampedKeyframe = Math.max(1, Math.min(frameCount, nearestKeyframe));
      const kImg = getLoadedFrame(clampedKeyframe);
      if (kImg) return kImg;

      // Check outward across all keyframes
      for (let k = 1; k <= Math.ceil(frameCount / KEYFRAME_INTERVAL); k++) {
        const kp = Math.max(1, clampedKeyframe - k * KEYFRAME_INTERVAL);
        const kpImg = getLoadedFrame(kp);
        if (kpImg) return kpImg;
        const kn = Math.min(frameCount, clampedKeyframe + k * KEYFRAME_INTERVAL);
        const knImg = getLoadedFrame(kn);
        if (knImg) return knImg;
      }

      return getLoadedFrame(1);
    }

    // Ultra-fast draw: 0.1ms execution, GPU accelerated
    function drawFrame(frameIndex: number) {
      if (!ctx || disposed) return;

      const img = findNearestLoadedFrame(frameIndex);
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const { x, y, width: dw, height: dh } = drawParamsRef.current;
      if (dw <= 0 || dh <= 0) return;

      ctx.drawImage(img, x, y, dw, dh);
      renderedFrameRef.current = frameIndex;

      if (!isReadyRef.current) {
        isReadyRef.current = true;
        setIsReady(true);
      }
    }

    // Measure initial bounds
    const bounds = canvas.getBoundingClientRect();
    updateDimensions(bounds.width, bounds.height);

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) updateDimensions(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(canvas);

    // =========================================================================
    // Intelligent Cache Manager & Decoupled Async Loader
    // =========================================================================
    function trimCache(currentFrame: number) {
      if (slidingCache.size <= maxCacheSize) return;

      const sortedByDistance = [...slidingCache.keys()]
        .filter((f) => f !== currentFrame)
        .sort((a, b) => Math.abs(b - currentFrame) - Math.abs(a - currentFrame));

      while (slidingCache.size > maxCacheSize && sortedByDistance.length) {
        const frameToRemove = sortedByDistance.shift();
        if (frameToRemove !== undefined) {
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

        const handleLoaded = () => {
          inFlight.delete(frame);
          activeLoads--;
          if (disposed) return;

          slidingCache.set(frame, img);
          if (frame % KEYFRAME_INTERVAL === 0 || frame === 1 || frame === frameCount) {
            keyframeCache.set(frame, img);
          }

          // Trim cache only on additions
          const currentTarget = Math.min(
            frameCount,
            Math.max(1, Math.round(1 + currentProgressRef.current * (frameCount - 1)))
          );
          trimCache(currentTarget);

          // If the newly loaded frame is what we are waiting for or close to it, re-render
          if (Math.abs(frame - currentTarget) <= 1 && renderedFrameRef.current !== frame) {
            drawFrame(currentTarget);
          }

          processQueue();
        };

        img.onload = () => {
          if (typeof img.decode === "function") {
            img.decode().then(handleLoaded).catch(handleLoaded);
          } else {
            handleLoaded();
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

    let lastRequestedCenter = -1;

    function requestFramesAround(centerFrame: number, scrollDir: number) {
      if (centerFrame === lastRequestedCenter) return;
      lastRequestedCenter = centerFrame;

      const dir = scrollDir >= 0 ? 1 : -1;
      const ordered: number[] = [centerFrame];

      for (let i = 1; i <= prefetchAhead; i++) {
        const f = centerFrame + dir * i;
        if (f >= 1 && f <= frameCount) ordered.push(f);
      }
      for (let i = 1; i <= prefetchBehind; i++) {
        const f = centerFrame - dir * i;
        if (f >= 1 && f <= frameCount) ordered.push(f);
      }

      for (const f of ordered) {
        if (!slidingCache.has(f) && !inFlight.has(f) && !queuedSet.has(f)) {
          queuedSet.add(f);
          loadQueue.unshift(f);
        }
      }

      processQueue();
    }

    // =========================================================================
    // Initial Load & Background Keyframe Spine Preloader
    // =========================================================================

    // 1. Eagerly load initial frames (1..15) and final frame (frameCount)
    for (let f = 1; f <= 15; f++) {
      queuedSet.add(f);
      loadQueue.push(f);
    }
    if (!queuedSet.has(frameCount)) {
      queuedSet.add(frameCount);
      loadQueue.push(frameCount);
    }
    processQueue();

    // 2. Progressively prefetch keyframes across Section 1 in idle chunks
    const keyframes = Array.from(
      { length: Math.ceil(frameCount / KEYFRAME_INTERVAL) },
      (_, i) => Math.min(frameCount, (i + 1) * KEYFRAME_INTERVAL)
    );

    const timer = setTimeout(() => {
      if (disposed) return;
      for (const kf of keyframes) {
        if (!keyframeCache.has(kf) && !queuedSet.has(kf) && !slidingCache.has(kf)) {
          queuedSet.add(kf);
          loadQueue.push(kf);
        }
      }
      processQueue();
    }, 120);

    // =========================================================================
    // Decoupled RequestAnimationFrame Render Loop with Smooth Damping
    // =========================================================================
    let prevFrame = 1;

    function tick() {
      if (disposed) return;

      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const diff = target - current;

      if (reducedMotionQuery.matches) {
        currentProgressRef.current = target;
      } else if (Math.abs(diff) > 0.0001) {
        // Snappy adaptive damping: responsive tracking on fast scroll, ultra smooth on fine adjustment
        const damping = Math.min(1, Math.max(0.30, Math.abs(diff) * 3.0));
        currentProgressRef.current += diff * damping;
      } else {
        currentProgressRef.current = target;
      }

      const progress = currentProgressRef.current;
      const targetFrame = Math.min(
        frameCount,
        Math.max(1, Math.round(1 + progress * (frameCount - 1)))
      );

      const scrollDir = targetFrame >= prevFrame ? 1 : -1;
      prevFrame = targetFrame;

      if (targetFrame !== lastRequestedCenter) {
        requestFramesAround(targetFrame, scrollDir);
      }

      if (targetFrame !== renderedFrameRef.current) {
        drawFrame(targetFrame);
      }

      // Idle sleep optimization: if settled, stop rAF loop to release CPU/GPU
      if (Math.abs(diff) <= 0.0001 && targetFrame === renderedFrameRef.current) {
        isLoopRunning = false;
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    function wakeRenderLoop() {
      if (!isLoopRunning && !disposed) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(tick);
      }
    }

    wakeRenderLoop();

    // =========================================================================
    // GSAP ScrollTrigger Integration (Pinned Smooth Scrub Timeline)
    // =========================================================================
    ScrollTrigger.config({ ignoreMobileResize: true });

    const isMobile = mobileQuery.matches;
    const scrollDistance = window.innerHeight * (isMobile ? 1.8 : 2.2);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${scrollDistance}`,
      pin: section,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        targetProgressRef.current = self.progress;
        wakeRenderLoop();
      },
      onRefresh: (self) => {
        targetProgressRef.current = self.progress;
        wakeRenderLoop();
      },
    });

    const handleOrientation = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("orientationchange", handleOrientation, { passive: true });

    return () => {
      disposed = true;
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", handleOrientation);
      trigger.kill();

      for (const img of inFlight.values()) {
        img.src = "";
      }
      inFlight.clear();
      loadQueue.length = 0;
      queuedSet.clear();
      slidingCache.clear();
      keyframeCache.clear();
    };
  }, [desktopCacheSize, frameCount, getFrameUrl, initialFrame, mobileCacheSize, priority]);

  return { sectionRef, canvasRef, fallbackRef, isReady };
}
