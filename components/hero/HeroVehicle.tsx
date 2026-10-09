"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import {
  heroVehiclePresentations,
  type HeroVehicle as HeroVehicleData,
} from "@/data/vehicles";

interface HeroVehicleProps {
  vehicle: HeroVehicleData;
  vehicleRef: RefObject<HTMLDivElement | null>;
  artworkRef: RefObject<HTMLDivElement | null>;
}

interface VehicleTransition {
  id: number;
  from: HeroVehicleData;
  to: HeroVehicleData;
}

interface VehicleImageFrameProps {
  vehicle: HeroVehicleData;
  priority: boolean;
  frameRef?: (element: HTMLDivElement | null) => void;
}

function VehicleImageFrame({
  vehicle,
  priority,
  frameRef,
}: VehicleImageFrameProps) {
  const presentation = heroVehiclePresentations[vehicle.category];

  return (
    <div
      aria-hidden="true"
      className="hero-vehicle__frame"
      data-hero-frame
      ref={frameRef}
    >
      <Image
        alt={`${presentation.brand} ${presentation.model}`}
        className="hero-vehicle__image"
        fill
        priority={priority}
        sizes="(max-width: 700px) 115vw, (max-width: 1024px) 75vw, 58vw"
        src={presentation.image}
        unoptimized
      />
    </div>
  );
}

export function HeroVehicle({
  vehicle,
  vehicleRef,
  artworkRef,
}: HeroVehicleProps) {
  const [displayedVehicle, setDisplayedVehicle] = useState(vehicle);
  const [transition, setTransition] = useState<VehicleTransition | null>(null);
  const targetVehicleRef = useRef(vehicle);
  const transitionIdRef = useRef(0);
  const outgoingFrameRef = useRef<HTMLDivElement>(null);
  const incomingFrameRef = useRef<HTMLDivElement>(null);
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const [initialVehicleId] = useState(vehicle.id);
  const reducedMotionRef = useRef(false);
  const setOutgoingFrame = useCallback(
    (element: HTMLDivElement | null) => {
      outgoingFrameRef.current = element;
    },
    [],
  );
  const setIncomingFrame = useCallback(
    (element: HTMLDivElement | null) => {
      incomingFrameRef.current = element;
    },
    [],
  );

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    Object.values(heroVehiclePresentations).forEach(({ image }) => {
      const preload = new window.Image();
      preload.src = image;
    });
  }, []);

  useLayoutEffect(() => {
    if (vehicle.id === targetVehicleRef.current.id) return;

    const from = targetVehicleRef.current;
    targetVehicleRef.current = vehicle;
    const id = ++transitionIdRef.current;
    transitionTimelineRef.current?.kill();

    if (reducedMotionRef.current) {
      setDisplayedVehicle(vehicle);
      setTransition(null);
      return;
    }

    setTransition({ id, from, to: vehicle });
  }, [vehicle]);

  useLayoutEffect(() => {
    if (!transition) return;

    const outgoingFrame = outgoingFrameRef.current;
    const incomingFrame = incomingFrameRef.current;
    if (!outgoingFrame || !incomingFrame) return;

    if (reducedMotionRef.current) {
      setDisplayedVehicle(transition.to);
      setTransition(null);
      return;
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        if (transition.id !== transitionIdRef.current) return;
        setDisplayedVehicle(transition.to);
        setTransition(null);
      },
    });

    timeline
      .fromTo(
        outgoingFrame,
        { autoAlpha: 1, x: 0, scale: 1, filter: "blur(0px)" },
        {
          autoAlpha: 0,
          x: 110,
          scale: 1.04,
          filter: "blur(7px)",
          duration: 0.58,
          ease: "power3.in",
        },
      )
      .fromTo(
        incomingFrame,
        { autoAlpha: 0, x: 110, y: 20, scale: 1.04, filter: "blur(7px)" },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.82,
          ease: "power3.out",
        },
        "-=0.36",
      );

    transitionTimelineRef.current = timeline;

    return () => {
      timeline.kill();
      if (transitionTimelineRef.current === timeline) {
        transitionTimelineRef.current = null;
      }
    };
  }, [transition]);

  useEffect(
    () => () => {
      transitionTimelineRef.current?.kill();
    },
    [],
  );

  const presentation = heroVehiclePresentations[vehicle.category];

  return (
    <div
      className={`hero-vehicle hero-vehicle--${vehicle.category}`}
      data-hero-vehicle
      ref={vehicleRef}
    >
      <div className="hero-vehicle__glow" />
      <div className="hero-vehicle__artwork" ref={artworkRef}>
        {transition
          ? [
              <VehicleImageFrame
                frameRef={setOutgoingFrame}
                key={transition.from.id}
                priority={transition.from.id === initialVehicleId}
                vehicle={transition.from}
              />,
              <VehicleImageFrame
                frameRef={setIncomingFrame}
                key={transition.to.id}
              priority={transition.to.id === initialVehicleId}
                vehicle={transition.to}
              />,
            ]
          : (
              <VehicleImageFrame
                key={displayedVehicle.id}
                priority={displayedVehicle.id === initialVehicleId}
                vehicle={displayedVehicle}
              />
            )}
      </div>
      <div className="hero-vehicle__caption">
        <span className="hero-vehicle__brand">{presentation.brand}</span>
        <strong className="hero-vehicle__model">{presentation.model}</strong>
        <a
          className="hero-vehicle__credit"
          href={presentation.source}
          rel="noreferrer"
          target="_blank"
        >
          Photo: {presentation.credit} · {presentation.license}
        </a>
      </div>
    </div>
  );
}
