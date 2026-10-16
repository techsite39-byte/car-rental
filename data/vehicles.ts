import fleetVehicleRecords from "./vehicles.json";

export type VehicleCategory =
  | "sport"
  | "suv"
  | "sedan"
  | "electric"
  | "convertible"
  | "mpv"
  | "hatchback";

export type FleetCategory = "all" | VehicleCategory;
export type ShowcaseCategory = Extract<
  VehicleCategory,
  "mpv" | "suv" | "sedan" | "hatchback"
>;
export type HeroCategory = ShowcaseCategory;

export const vehicleCategoryLabels: Record<VehicleCategory, string> = {
  sport: "Sport",
  suv: "SUV",
  sedan: "Sedan",
  electric: "Electric",
  convertible: "Convertible",
  mpv: "MPV",
  hatchback: "Hatchback",
};

export interface Vehicle {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model?: string;
  category: VehicleCategory;
  type: string;
  pricePerDay: number;
  seats: number;
  rating?: number;
  horsepower?: number;
  acceleration?: number;
  transmission?: string;
  fuelType: string;
  image: string;
  heroImage?: string;
  imagePlaceholder?: string;
  description: string;
  available: boolean;
  featured?: boolean;
  showInFleet?: boolean;
}

export type HeroVehicle = Omit<Vehicle, "category"> & {
  category: HeroCategory;
};

function isFleetCategory(value: string): value is Extract<
  VehicleCategory,
  "mpv" | "suv" | "sedan" | "hatchback"
> {
  return (
    value === "mpv" ||
    value === "suv" ||
    value === "sedan" ||
    value === "hatchback"
  );
}

export const fleetVehicles: Vehicle[] = fleetVehicleRecords.map((vehicle) => {
  if (!isFleetCategory(vehicle.category)) {
    throw new Error(`Unknown fleet category for "${vehicle.id}".`);
  }
  return {
    ...vehicle,
    category: vehicle.category,
    heroImage: vehicle.image,
    imagePlaceholder: vehicle.image,
  };
});

export const vehicles = fleetVehicles;

export const heroCategoryVehicleIds: Record<HeroCategory, string> = {
  mpv: "maruti-ertiga",
  suv: "kia-clavis",
  sedan: "maruti-dzire",
  hatchback: "maruti-celerio",
};

export function getHeroVehicle(category: HeroCategory): HeroVehicle {
  const vehicleId = heroCategoryVehicleIds[category];
  const vehicle = vehicles.find(({ id }) => id === vehicleId);

  if (!vehicle || !isHeroVehicle(vehicle, category)) {
    throw new Error(
      `Hero category "${category}" references an invalid vehicle "${vehicleId}".`,
    );
  }

  return vehicle;
}

function isHeroVehicle(
  vehicle: Vehicle,
  category: HeroCategory,
): vehicle is HeroVehicle {
  return vehicle.category === category;
}

export const bookingVehicles = fleetVehicles;
