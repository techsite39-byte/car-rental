import fleetVehicleRecords from "./vehicles.json";
import originalVehicleRecords from "./original-vehicles.json";

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
  "sport" | "suv" | "sedan" | "electric" | "convertible"
>;
export type HeroCategory = Exclude<ShowcaseCategory, "convertible">;

export const vehicleCategoryLabels: Record<VehicleCategory, string> = {
  sport: "Sport",
  suv: "SUV",
  sedan: "Sedan",
  electric: "Electric",
  convertible: "Convertible",
  mpv: "MPV",
  hatchback: "Hatchback",
};

export interface HeroVehiclePresentation {
  brand: string;
  model: string;
  image: string;
  credit: string;
  license: string;
  source: string;
}

export const heroVehiclePresentations: Record<
  HeroCategory,
  HeroVehiclePresentation
> = {
  sport: {
    brand: "Aston Martin",
    model: "Vantage",
    image: "/images/vehicles/hero-aston-martin-vantage.png",
    credit: "Alexander-93",
    license: "CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Aston_Martin_Vantage_(2024)_IMG_0002.jpg",
  },
  suv: {
    brand: "Range Rover",
    model: "Range Rover Sport",
    image: "/images/vehicles/hero-luxury-suv.png",
    credit: "Damian B. Oh",
    license: "CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Land_Rover_Range_Rover_Sport_L494_FL_Santorini_Black_(1).jpg",
  },
  sedan: {
    brand: "Mercedes-Benz",
    model: "S-Class",
    image: "/images/vehicles/hero-mercedes-s-class.png",
    credit: "Dinkun Chen",
    license: "CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:MERCEDES-BENZ_S-CLASS_(W223)_China_(3).jpg",
  },
  electric: {
    brand: "Porsche",
    model: "Taycan",
    image: "/images/vehicles/hero-porsche-taycan.png",
    credit: "Harvey Bold",
    license: "CC0",
    source:
      "https://commons.wikimedia.org/wiki/File:2022_Porsche_Taycan_4S_EV_-_93kWh_(571PS)_Electric_-_Blue_-_02-2025,_Front.jpg",
  },
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

function isShowcaseCategory(value: string): value is ShowcaseCategory {
  return (
    value === "sport" ||
    value === "suv" ||
    value === "sedan" ||
    value === "electric" ||
    value === "convertible"
  );
}

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

const originalVehicles: Vehicle[] = originalVehicleRecords.map((vehicle) => {
  if (!isShowcaseCategory(vehicle.category)) {
    throw new Error(`Unknown original vehicle category for "${vehicle.id}".`);
  }
  return {
    ...vehicle,
    category: vehicle.category,
    heroImage: vehicle.image,
    imagePlaceholder: vehicle.image,
  };
});

export const vehicles = originalVehicles;

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

export const heroCategoryVehicleIds: Record<HeroCategory, string> = {
  sport: "vantage-gt",
  suv: "atlas-x7",
  sedan: "monarch-l",
  electric: "aurora-s",
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

export const bookingVehicles = [...vehicles, ...fleetVehicles];
