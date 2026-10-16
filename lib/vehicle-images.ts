import type { Vehicle } from "@/data/vehicles";

const localVehicleImages = {
  "kia clavis": "/carsimg/kiaklavis.png",
  "kia carens clavis": "/carsimg/kiaklavis.png",
  ertiga: "/carsimg/suzukietiga.png",
  "maruti suzuki ertiga": "/carsimg/suzukietiga.png",
  brezza: "/carsimg/suzukibreza.png",
  "maruti suzuki brezza": "/carsimg/suzukibreza.png",
  kiger: "/carsimg/renaultkiger.png",
  "renault kiger": "/carsimg/renaultkiger.png",
  dzire: "/carsimg/suzukidzire.png",
  "maruti suzuki dzire": "/carsimg/suzukidzire.png",
  celerio: "/carsimg/suzukicelerio.png",
  "maruti suzuki celerio": "/carsimg/suzukicelerio.png",
} as const;

const legacyVehicleImages = new Set([
  "/images/vehicles/kia-carens-clavis.jpg",
  "/images/vehicles/maruti-ertiga.jpg",
  "/images/vehicles/maruti-brezza.jpg",
  "/images/vehicles/renault-kiger.webp",
  "/images/vehicles/maruti-dzire.jpg",
  "/images/vehicles/maruti-celerio.webp",
]);

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getLocalVehicleImage(vehicle: Pick<Vehicle, "name" | "model" | "image">) {
  const image =
    localVehicleImages[normalize(vehicle.name) as keyof typeof localVehicleImages] ??
    localVehicleImages[normalize(vehicle.model) as keyof typeof localVehicleImages];

  if (!image) return vehicle.image;
  return legacyVehicleImages.has(vehicle.image) || vehicle.image === image
    ? image
    : vehicle.image;
}
