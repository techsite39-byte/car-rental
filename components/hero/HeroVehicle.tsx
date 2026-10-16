"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { RefObject } from "react";
import {
  heroVehiclePresentations,
  vehicleCategoryLabels,
  type HeroCategory,
  type HeroVehicle as HeroVehicleData,
} from "@/data/vehicles";

interface HeroVehicleProps {
  vehicle: HeroVehicleData;
  vehicleRef: RefObject<HTMLDivElement | null>;
  artworkRef: RefObject<HTMLDivElement | null>;
}

const categoryVehicleImages: Record<HeroCategory, string> = {
  sport: "/sport.png",
  suv: "/suv.png",
  sedan: "/sedan.png",
  electric: "/electric.png",
};

const categoryMotion: Record<HeroCategory, Variants> = {
  sport: {
    enter: { opacity: 0, x: -220, scale: 0.98 },
    visible: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 48, scale: 0.99 },
  },
  suv: {
    enter: { opacity: 0, x: -88, y: 16, scale: 0.985 },
    visible: { opacity: 1, x: 0, y: [16, -3, 0], scale: 1 },
    exit: { opacity: 0, x: 40, scale: 0.99 },
  },
  sedan: {
    enter: { opacity: 0, x: -68 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 36 },
  },
  electric: {
    enter: {
      opacity: 0,
      x: 60,
      filter: "drop-shadow(0 0 0 rgb(216 255 79 / 0%))",
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: "drop-shadow(0 0 24px rgb(216 255 79 / 20%))",
    },
    exit: { opacity: 0, x: 32 },
  },
};

const reducedMotionVariants: Variants = {
  enter: { opacity: 1, x: 0, y: 0, scale: 1, filter: "none" },
  visible: { opacity: 1, x: 0, y: 0, scale: 1, filter: "none" },
  exit: { opacity: 1, x: 0, y: 0, scale: 1 },
};

const categoryTransition = {
  duration: 0.88,
  ease: [0.2, 0.82, 0.25, 1] as const,
};

interface VehicleImageFrameProps {
  vehicle: HeroVehicleData;
  reduceMotion: boolean;
}

function VehicleImageFrame({
  vehicle,
  reduceMotion,
}: VehicleImageFrameProps) {
  return (
    <motion.div
      aria-hidden="true"
      className="hero-vehicle__frame"
      data-hero-frame
      animate="visible"
      exit="exit"
      initial={reduceMotion ? false : "enter"}
      transition={reduceMotion ? { duration: 0 } : categoryTransition}
      variants={
        reduceMotion ? reducedMotionVariants : categoryMotion[vehicle.category]
      }
    >
      <Image
        alt={`${vehicleCategoryLabels[vehicle.category]} car`}
        className="hero-vehicle__image"
        fill
        loading="lazy"
        sizes="(max-width: 700px) 100vw, (max-width: 1024px) 75vw, 58vw"
        src={categoryVehicleImages[vehicle.category]}
      />
    </motion.div>
  );
}

export function HeroVehicle({
  vehicle,
  vehicleRef,
  artworkRef,
}: HeroVehicleProps) {
  const presentation = heroVehiclePresentations[vehicle.category];
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      className={`hero-vehicle hero-vehicle--${vehicle.category}`}
      data-hero-vehicle
      ref={vehicleRef}
    >
      <div className="hero-vehicle__glow" />
      <div
        className="hero-vehicle__artwork"
        ref={artworkRef}
        style={{ maskImage: "none", WebkitMaskImage: "none" }}
      >
        {reduceMotion ? (
          <VehicleImageFrame
            key={vehicle.category}
            reduceMotion
            vehicle={vehicle}
          />
        ) : (
          <AnimatePresence initial={false} mode="wait">
            <VehicleImageFrame
              key={vehicle.category}
              reduceMotion={false}
              vehicle={vehicle}
            />
          </AnimatePresence>
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
