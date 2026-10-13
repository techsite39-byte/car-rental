"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

const MOBILE_QUERY = "(max-width: 700px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PREFETCH_AHEAD = 8;
const PREFETCH_BEHIND = 3;
const MOBILE_MAX_LOADS = 2;
const DESKTOP_MAX_LOADS = 3;

gsap.registerPlugin(ScrollTrigger);

interface ScrollFrameSequenceOptions {
  frameCount: number;
  initialFrame: number;
  getFrameUrl: (frame: number) => string;
  mobileCacheSize: number;
  desktopCacheSize: number;
}

export function useScrollFrameSequence({
  frameCount,
  initialFrame,
  getFrameUrl,
  mobileCacheSize,
  desktopCacheSize,
}: ScrollFrameSequenceOptions) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const requestFrameRef = useRef<(frame: number) => void>(() => {});
  const [isReady, setIsReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    const contextElement = canvasElement?.getContext("2d", { alpha: false });
    if (!canvasElement || !contextElement) {
      console.error("The automotive frame sequence could not create a 2D canvas.");
      return;
    }
    const canvas = canvasElement;
    const context = contextElement;
    const fallbackImage = fallbackRef.current;
    const mobileMediaQuery = window.matchMedia(MOBILE_QUERY);

    let disposed = false;
    let activeLoads = 0;
    let currentFrame = initialFrame;
    let previousFrame = initialFrame;
    let direction = 1;
    let hasRequestedFrame = false;
    let drawRequest = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let needsDraw = true;
    let forceDraw = true;
    let hasDrawnInitialFrame = false;
    let lastDrawnFrame = -1;
    let lastDrawnImage: HTMLImageElement | null = null;

    const cache = new Map<number, HTMLImageElement>();
    const loading = new Map<number, HTMLImageElement>();
    const failed = new Set<number>();
    const queued = new Set<number>();
    const queue: number[] = [];

    function scheduleDraw() {
      if (!drawRequest && !disposed) {
        drawRequest = window.requestAnimationFrame(drawFrame);
      }
    }

    function drawFrame() {
      drawRequest = 0;
      if (disposed || !width || !height) return;

      let drawFrameIndex = currentFrame;
      let image = cache.get(currentFrame);
      if (!image && cache.size) {
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (const [frame, cachedImage] of cache) {
          const distance = Math.abs(frame - currentFrame);
          if (
            distance < nearestDistance ||
            (distance === nearestDistance &&
              (direction > 0
                ? frame > drawFrameIndex
                : frame < drawFrameIndex))
          ) {
            nearestDistance = distance;
            drawFrameIndex = frame;
            image = cachedImage;
          }
        }
      }
      if (!image) {
        image = lastDrawnImage ?? undefined;
        drawFrameIndex = lastDrawnFrame;
      }
      if (!image || (!forceDraw && drawFrameIndex === lastDrawnFrame)) {
        needsDraw = drawFrameIndex !== currentFrame;
        return;
      }

      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const imageWidth = image.naturalWidth * scale;
      const imageHeight = image.naturalHeight * scale;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.drawImage(
        image,
        (width - imageWidth) / 2,
        (height - imageHeight) / 2,
        imageWidth,
        imageHeight,
      );

      lastDrawnImage = image;
      lastDrawnFrame = drawFrameIndex;
      canvas.dataset.frame = String(drawFrameIndex);
      needsDraw = drawFrameIndex !== currentFrame;
      forceDraw = false;

      if (
        !hasDrawnInitialFrame &&
        drawFrameIndex === initialFrame &&
        cache.has(initialFrame)
      ) {
        hasDrawnInitialFrame = true;
        setIsReady(true);
      }
    }

    function trimCache() {
      const isMobile = mobileMediaQuery.matches;
      const maxCacheSize = isMobile ? mobileCacheSize : desktopCacheSize;
      if (cache.size <= maxCacheSize) return;

      const framesToRemove = [...cache.keys()]
        .filter((frame) => frame !== currentFrame)
        .sort(
          (first, second) =>
            Math.abs(second - currentFrame) - Math.abs(first - currentFrame),
        );

      while (cache.size > maxCacheSize && framesToRemove.length) {
        const frame = framesToRemove.shift();
        if (frame !== undefined) cache.delete(frame);
      }
    }

    function drainQueue() {
      const isMobile = mobileMediaQuery.matches;
      const maxLoads = isMobile ? MOBILE_MAX_LOADS : DESKTOP_MAX_LOADS;

      while (!disposed && activeLoads < maxLoads && queue.length) {
        const frame = queue.shift();
        if (frame === undefined) return;
        queued.delete(frame);
        if (cache.has(frame) || loading.has(frame) || failed.has(frame)) continue;

        const isInitialFrame = frame === initialFrame;
        const image = isInitialFrame
          ? fallbackImage
          : new window.Image();
        if (!image) continue;

        if (!isInitialFrame) {
          image.decoding = "async";
          image.src = getFrameUrl(frame);
        }
        loading.set(frame, image);
        activeLoads += 1;

        void image.decode().then(
          () => {
            if (loading.get(frame) !== image) return;
            loading.delete(frame);
            activeLoads -= 1;
            if (disposed) return;

            cache.set(frame, image);
            if (frame === currentFrame || needsDraw) {
              scheduleDraw();
            }
            trimCache();
            drainQueue();
          },
          (error: unknown) => {
            if (loading.get(frame) !== image) return;
            loading.delete(frame);
            failed.add(frame);
            activeLoads -= 1;
            if (disposed) return;

            console.error(
              `The automotive frame could not be decoded: ${getFrameUrl(frame)}`,
              error,
            );
            drainQueue();
          },
        );
      }
    }

    function enqueue(frame: number, prioritize = false) {
      if (
        frame < initialFrame ||
        frame >= initialFrame + frameCount ||
        cache.has(frame) ||
        loading.has(frame) ||
        failed.has(frame)
      ) {
        return;
      }

      if (queued.has(frame)) {
        if (prioritize) {
          const queuedIndex = queue.indexOf(frame);
          if (queuedIndex >= 0) queue.splice(queuedIndex, 1);
          queue.unshift(frame);
        }
      } else {
        queued.add(frame);
        if (prioritize) queue.unshift(frame);
        else queue.push(frame);
      }
    }

    function requestFrame(frame: number) {
      const nextFrame = Math.max(
        initialFrame,
        Math.min(initialFrame + frameCount - 1, Math.round(frame)),
      );
      if (nextFrame === currentFrame && hasRequestedFrame) {
        if (needsDraw && cache.has(currentFrame)) scheduleDraw();
        return;
      }

      hasRequestedFrame = true;
      if (nextFrame !== currentFrame) {
        previousFrame = currentFrame;
        currentFrame = nextFrame;
        direction = currentFrame >= previousFrame ? 1 : -1;
        needsDraw = true;
      }

      const desiredFrames = new Set<number>([currentFrame]);
      for (let offset = 1; offset <= PREFETCH_AHEAD; offset += 1) {
        desiredFrames.add(currentFrame + direction * offset);
        if (offset <= PREFETCH_BEHIND) {
          desiredFrames.add(currentFrame - direction * offset);
        }
      }

      for (let index = queue.length - 1; index >= 0; index -= 1) {
        const frame = queue[index];
        if (!desiredFrames.has(frame)) {
          queue.splice(index, 1);
          queued.delete(frame);
        }
      }

      for (const [frame, image] of loading) {
        if (!desiredFrames.has(frame) && frame !== initialFrame) {
          loading.delete(frame);
          activeLoads -= 1;
          image.src = "";
        }
      }

      enqueue(currentFrame, true);
      for (let offset = 1; offset <= PREFETCH_AHEAD; offset += 1) {
        enqueue(currentFrame + direction * offset);
        if (offset <= PREFETCH_BEHIND) {
          enqueue(currentFrame - direction * offset);
        }
      }

      if (cache.size) scheduleDraw();
      trimCache();
      drainQueue();
    }

    function resize(widthValue: number, heightValue: number) {
      width = widthValue;
      height = heightValue;
      if (!width || !height) return;

      const isMobile = mobileMediaQuery.matches;
      pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2);
      const canvasWidth = Math.round(width * pixelRatio);
      const canvasHeight = Math.round(height * pixelRatio);
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        needsDraw = true;
        forceDraw = true;
        scheduleDraw();
      }
    }

    const bounds = canvas.getBoundingClientRect();
    resize(bounds.width, bounds.height);
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) resize(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(canvas);

    requestFrameRef.current = requestFrame;
    requestFrame(initialFrame);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      if (drawRequest) window.cancelAnimationFrame(drawRequest);
      for (const image of loading.values()) {
        if (image !== fallbackImage) image.src = "";
      }
      loading.clear();
      queue.length = 0;
      cache.clear();
      requestFrameRef.current = () => {};
    };
  }, [desktopCacheSize, frameCount, getFrameUrl, initialFrame, mobileCacheSize]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion || !isReady) return;

    const progress = { frame: initialFrame };
    const context = gsap.context(() => {
      gsap.to(progress, {
        frame: initialFrame + frameCount - 1,
        ease: "none",
        onUpdate: () => requestFrameRef.current(Math.round(progress.frame)),
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () =>
            `+=${window.innerHeight * (window.matchMedia(MOBILE_QUERY).matches ? 1.5 : 2)}`,
          pin: section,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => context.revert();
  }, [frameCount, initialFrame, isReady, prefersReducedMotion]);

  return { sectionRef, canvasRef, fallbackRef, isReady };
}
