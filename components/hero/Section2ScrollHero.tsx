"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "./Section2ScrollHero.css";

const FRAME_COUNT = 150;
const MAX_CONCURRENT_LOADS = 3;
const MAX_CACHED_FRAMES = 24;
const PREFETCH_AHEAD = 8;
const PREFETCH_BEHIND = 3;

gsap.registerPlugin(ScrollTrigger);

function getFrameUrl(frameIndex: number) {
  return `/section2/frame_${String(frameIndex + 1).padStart(3, "0")}.jpg`;
}

export function Section2ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestFrameRef = useRef<(frame: number) => void>(() => {});
  const [isReady, setIsReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) {
      console.error("The second automotive frame sequence could not create a 2D canvas.");
      return;
    }
    const targetCanvas = canvas;
    const targetContext = context;

    let disposed = false;
    let activeLoads = 0;
    let currentFrame = 0;
    let drawRequest = 0;
    let ready = false;
    const cache = new Map<number, HTMLImageElement>();
    const loading = new Set<number>();
    const loadingImages = new Set<HTMLImageElement>();
    const failed = new Set<number>();
    const queued = new Set<number>();
    const queue: number[] = [];

    function drawFrame(frameIndex: number, image: HTMLImageElement) {
      const bounds = targetCanvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height || disposed) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(bounds.width * pixelRatio);
      const height = Math.round(bounds.height * pixelRatio);
      if (targetCanvas.width !== width || targetCanvas.height !== height) {
        targetCanvas.width = width;
        targetCanvas.height = height;
      }

      targetContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      targetContext.clearRect(0, 0, bounds.width, bounds.height);

      if (window.matchMedia("(max-width: 700px)").matches) {
        const backgroundScale = Math.max(
          bounds.width / image.naturalWidth,
          bounds.height / image.naturalHeight,
        );
        const backgroundWidth = image.naturalWidth * backgroundScale;
        const backgroundHeight = image.naturalHeight * backgroundScale;

        targetContext.save();
        targetContext.filter = "blur(28px) brightness(0.45)";
        targetContext.drawImage(
          image,
          (bounds.width - backgroundWidth) / 2,
          (bounds.height - backgroundHeight) / 2,
          backgroundWidth,
          backgroundHeight,
        );
        targetContext.restore();
        targetContext.imageSmoothingEnabled = true;
        targetContext.imageSmoothingQuality = "high";
      }

      const fittedScale = Math.min(
        bounds.width / image.naturalWidth,
        bounds.height / image.naturalHeight,
      );
      const imageWidth = image.naturalWidth * fittedScale;
      const imageHeight = image.naturalHeight * fittedScale;
      targetContext.drawImage(
        image,
        (bounds.width - imageWidth) / 2,
        (bounds.height - imageHeight) / 2,
        imageWidth,
        imageHeight,
      );
      targetCanvas.dataset.frame = String(frameIndex);

      if (!ready) {
        ready = true;
        setIsReady(true);
      }
    }

    function drawAvailableFrame() {
      drawRequest = 0;
      if (disposed) return;

      const image = cache.get(currentFrame);
      if (image) {
        drawFrame(currentFrame, image);
        return;
      }

      if (!failed.has(currentFrame) || !cache.size) return;
      let nearestFrame = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const frame of cache.keys()) {
        const distance = Math.abs(frame - currentFrame);
        if (distance < nearestDistance) {
          nearestFrame = frame;
          nearestDistance = distance;
        }
      }
      const nearestImage = cache.get(nearestFrame);
      if (nearestImage) drawFrame(nearestFrame, nearestImage);
    }

    function scheduleDraw() {
      if (!drawRequest && !disposed) {
        drawRequest = window.requestAnimationFrame(drawAvailableFrame);
      }
    }

    function trimCache() {
      if (cache.size <= MAX_CACHED_FRAMES) return;
      const framesToRemove = [...cache.keys()]
        .filter((frame) => Math.abs(frame - currentFrame) > PREFETCH_AHEAD + 2)
        .sort(
          (first, second) =>
            Math.abs(second - currentFrame) - Math.abs(first - currentFrame),
        );

      while (cache.size > MAX_CACHED_FRAMES && framesToRemove.length) {
        const frame = framesToRemove.shift();
        if (frame !== undefined) cache.delete(frame);
      }
    }

    function drainQueue() {
      while (!disposed && activeLoads < MAX_CONCURRENT_LOADS && queue.length) {
        const frame = queue.shift();
        if (frame === undefined) return;
        queued.delete(frame);
        if (cache.has(frame) || loading.has(frame) || failed.has(frame)) continue;

        const image = new window.Image();
        image.decoding = "async";
        loading.add(frame);
        loadingImages.add(image);
        activeLoads += 1;
        image.onload = () => {
          loading.delete(frame);
          loadingImages.delete(image);
          activeLoads -= 1;
          if (disposed) return;

          cache.set(frame, image);
          scheduleDraw();
          trimCache();
          drainQueue();
        };
        image.onerror = () => {
          loading.delete(frame);
          loadingImages.delete(image);
          failed.add(frame);
          activeLoads -= 1;
          console.error(`The second automotive frame could not be loaded: ${getFrameUrl(frame)}`);
          scheduleDraw();
          drainQueue();
        };
        image.src = getFrameUrl(frame);
      }
    }

    function enqueue(frame: number, prioritize = false) {
      if (
        frame < 0 ||
        frame >= FRAME_COUNT ||
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
      drainQueue();
    }

    function requestFrame(frameIndex: number) {
      currentFrame = Math.max(
        0,
        Math.min(FRAME_COUNT - 1, Math.round(frameIndex)),
      );
      enqueue(currentFrame, true);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      for (let offset = 1; offset <= PREFETCH_AHEAD; offset += 1) {
        enqueue(currentFrame + offset);
        if (offset <= PREFETCH_BEHIND) enqueue(currentFrame - offset);
      }
      trimCache();
      scheduleDraw();
    }

    requestFrameRef.current = requestFrame;
    requestFrame(0);

    const resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(targetCanvas);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      if (drawRequest) window.cancelAnimationFrame(drawRequest);
      for (const image of loadingImages) {
        image.onload = null;
        image.onerror = null;
      }
      loadingImages.clear();
      requestFrameRef.current = () => {};
      queue.length = 0;
      cache.clear();
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion || !isReady) return;

    const progress = { frame: 0 };
    const context = gsap.context(() => {
      gsap.to(progress, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        onUpdate: () => requestFrameRef.current(Math.round(progress.frame)),
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () =>
            `+=${window.innerHeight * (window.matchMedia("(max-width: 767px)").matches ? 1.5 : 2)}`,
          pin: section,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => context.revert();
  }, [isReady, prefersReducedMotion]);

  return (
    <section
      aria-label="Second automotive frame sequence"
      className={`section2-sequence${isReady ? " section2-sequence--ready" : ""}`}
      ref={sectionRef}
    >
      <Image
        alt=""
        className="section2-sequence__fallback"
        decoding="async"
        draggable={false}
        fetchPriority="high"
        height={720}
        src={getFrameUrl(0)}
        unoptimized
        width={1280}
      />
      <canvas
        aria-hidden="true"
        className="section2-sequence__canvas"
        ref={canvasRef}
      />
    </section>
  );
}
