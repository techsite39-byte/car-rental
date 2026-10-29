"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import type { RefObject } from "react";
import { vehicleCategoryLabels, type HeroCategory, type HeroVehicle as HeroVehicleData } from "@/data/vehicles";
import { getLocalVehicleImage } from "@/lib/vehicle-images";

interface HeroVehicleProps {
  vehicle: HeroVehicleData;
  vehicleRef: RefObject<HTMLDivElement | null>;
  artworkRef: RefObject<HTMLDivElement | null>;
}

const categoryVehicleImages: Record<HeroCategory, string> = {
  mpv: "/carsimg/suzukietiga.png",
  suv: "/carsimg/kiaklavis.png",
  sedan: "/carsimg/suzukidzire.png",
  hatchback: "/carsimg/suzukicelerio.png",
};

const categoryMotion: Record<HeroCategory, Variants> = {
  mpv: { enter: { opacity: 0, x: -88, y: 16, scale: 0.985 }, visible: { opacity: 1, x: 0, y: [16, -3, 0], scale: 1 }, exit: { opacity: 0, x: 40, scale: 0.99 } },
  suv: { enter: { opacity: 0, x: -88, y: 16, scale: 0.985 }, visible: { opacity: 1, x: 0, y: [16, -3, 0], scale: 1 }, exit: { opacity: 0, x: 40, scale: 0.99 } },
  sedan: { enter: { opacity: 0, x: -68 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 36 } },
  hatchback: { enter: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 32 } },
};

const categoryTransition = { duration: 0.88, ease: [0.2, 0.82, 0.25, 1] as const };

function VehicleImageFrame({ vehicle, reduceMotion }: { vehicle: HeroVehicleData; reduceMotion: boolean }) {
  const image = getLocalVehicleImage(vehicle) || categoryVehicleImages[vehicle.category];

  return (
    <motion.div
      aria-hidden="true"
      className="hero-vehicle__frame"
      data-hero-frame
      animate="visible"
      exit="exit"
      initial="enter"
      transition={reduceMotion ? { duration: 0 } : categoryTransition}
      variants={categoryMotion[vehicle.category]}
    >
      <Image
        alt={`${vehicle.name}, ${vehicleCategoryLabels[vehicle.category]}`}
        className="hero-vehicle__image"
        fill
        loading="lazy"
        sizes="(max-width: 700px) 100vw, (max-width: 1024px) 75vw, 58vw"
        src={image}
      />
    </motion.div>
  );
}

export function HeroVehicle({ vehicle, vehicleRef, artworkRef }: HeroVehicleProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className={`hero-vehicle hero-vehicle--${vehicle.category}`} data-hero-vehicle ref={vehicleRef}>
      <div className="hero-vehicle__glow" />
      <div className="hero-vehicle__artwork" ref={artworkRef} style={{ maskImage: "none", WebkitMaskImage: "none" }}>
        <AnimatePresence initial={false} mode="wait">
          <VehicleImageFrame
            key={vehicle.id}
            reduceMotion={reduceMotion}
            vehicle={vehicle}
          />
        </AnimatePresence>
      </div>
      <div className="hero-vehicle__caption">
        <span className="hero-vehicle__brand">{vehicle.brand}</span>
        <strong className="hero-vehicle__model">{vehicle.name}</strong>
      </div>
    </div>
  );
}
