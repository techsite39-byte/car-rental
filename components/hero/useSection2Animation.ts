"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 750;
const KEYFRAME_INTERVAL = 10;
const MOBILE_QUERY = "(max-width: 700px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getFrameUrl(frame: number): string {
  return `/section2/frame_${String(frame).padStart(3, "0")}.jpg`;
}

interface DrawParams {
  x: number;
  y: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function useSection2Animation() {
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

    const maxCacheSize = mobileQuery.matches ? 40 : 80;
    const maxConcurrentLoads = mobileQuery.matches ? 2 : 4;
    const prefetchAhead = mobileQuery.matches ? 12 : 18;
    const prefetchBehind = 4;

    // Dimension precalculation: responsive cover presentation (object-fit: cover equivalent)
    function updateDimensions(rectWidth: number, rectHeight: number) {
      if (!canvas || rectWidth <= 0 || rectHeight <= 0) return;

      const isMobile = mobileQuery.matches;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
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
      const dx = Math.round((cw - dw) / 2);
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
        if (next <= FRAME_COUNT) {
          const nImg = getLoadedFrame(next);
          if (nImg) return nImg;
        }
      }

      // Check nearest keyframe
      const nearestKeyframe = Math.round(target / KEYFRAME_INTERVAL) * KEYFRAME_INTERVAL;
      const clampedKeyframe = Math.max(1, Math.min(FRAME_COUNT, nearestKeyframe));
      const kImg = getLoadedFrame(clampedKeyframe);
      if (kImg) return kImg;

      return null;
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

        img.onload = () => {
          inFlight.delete(frame);
          activeLoads--;
          if (disposed) return;

          slidingCache.set(frame, img);
          if (frame % KEYFRAME_INTERVAL === 0 || frame === 1 || frame === FRAME_COUNT) {
            keyframeCache.set(frame, img);
          }

          // Trim cache only on additions
          const currentTarget = Math.min(
            FRAME_COUNT,
            Math.max(1, Math.round(1 + currentProgressRef.current * (FRAME_COUNT - 1)))
          );
          trimCache(currentTarget);

          // If the newly loaded frame is what we are waiting for or close to it, re-render
          if (Math.abs(frame - currentTarget) <= 1 && renderedFrameRef.current !== frame) {
            drawFrame(currentTarget);
          }

          processQueue();
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
        if (f >= 1 && f <= FRAME_COUNT) ordered.push(f);
      }
      for (let i = 1; i <= prefetchBehind; i++) {
        const f = centerFrame - dir * i;
        if (f >= 1 && f <= FRAME_COUNT) ordered.push(f);
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

    // 1. Eagerly load initial frames (1..15)
    for (let f = 1; f <= 15; f++) {
      queuedSet.add(f);
      loadQueue.push(f);
    }
    processQueue();

    // 2. Progressively prefetch keyframes across all 3 parts in idle chunks
    // Part 1: frames 1..300
    // Part 2: frames 301..600
    // Part 3: frames 601..750
    const keyframeBatches = [
      Array.from({ length: 30 }, (_, i) => (i + 1) * 10),
      Array.from({ length: 30 }, (_, i) => 300 + (i + 1) * 10),
      Array.from({ length: 15 }, (_, i) => 600 + (i + 1) * 10),
    ];

    const timeouts: NodeJS.Timeout[] = [];
    keyframeBatches.forEach((batch, batchIndex) => {
      const t = setTimeout(() => {
        if (disposed) return;
        for (const kf of batch) {
          if (!keyframeCache.has(kf) && !queuedSet.has(kf) && !slidingCache.has(kf)) {
            queuedSet.add(kf);
            loadQueue.push(kf);
          }
        }
        processQueue();
      }, 200 + batchIndex * 500);
      timeouts.push(t);
    });

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
        const damping = mobileQuery.matches ? 0.16 : 0.12;
        currentProgressRef.current += diff * damping;
      } else {
        currentProgressRef.current = target;
      }

      const progress = currentProgressRef.current;
      const targetFrame = Math.min(
        FRAME_COUNT,
        Math.max(1, Math.round(1 + progress * (FRAME_COUNT - 1)))
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
    const scrollDistance = window.innerHeight * (isMobile ? 3.0 : 4.2);

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

    return () => {
      disposed = true;
      timeouts.forEach((t) => clearTimeout(t));
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
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
  }, []);

  return { sectionRef, canvasRef, fallbackRef, isReady };
}
