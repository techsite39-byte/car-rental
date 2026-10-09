export type VehicleCategory =
  | "sport"
  | "suv"
  | "sedan"
  | "electric"
  | "convertible";

export type FleetCategory = "all" | VehicleCategory;

export type HeroCategory = Extract<
  VehicleCategory,
  "sport" | "suv" | "sedan" | "electric"
>;

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
  rating: number;
  horsepower: number;
  acceleration: number;
  transmission: string;
  fuelType: string;
  image: string;
  heroImage?: string;
  imagePlaceholder?: string;
  description: string;
  available: boolean;
  featured?: boolean;
}

export type HeroVehicle = Omit<Vehicle, "category"> & {
  category: HeroCategory;
};

const realisticVehicleArt = {
  suv:
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1400&q=80",
  electric:
    "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1400&q=80",
  sport:
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80",
  sedan:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
  convertible:
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1400&q=80",
} as const;

export const vehicles: Vehicle[] = [
  {
    id: "atlas-x7",
    slug: "atlas-x7",
    name: "Atlas X7",
    brand: "Northstar",
    category: "suv",
    type: "Luxury SUV",
    pricePerDay: 420,
    seats: 5,
    rating: 4.9,
    horsepower: 420,
    acceleration: 5.2,
    transmission: "Automatic",
    fuelType: "Hybrid",
    image: realisticVehicleArt.suv,
    heroImage: realisticVehicleArt.suv,
    imagePlaceholder: realisticVehicleArt.suv,
    description:
      "A composed grand tourer built for long horizons and effortless arrivals.",
    available: true,
  },
  {
    id: "aurora-s",
    slug: "aurora-s",
    name: "Aurora S",
    brand: "Aurelia",
    category: "electric",
    type: "Electric sedan",
    pricePerDay: 390,
    seats: 5,
    rating: 4.8,
    horsepower: 510,
    acceleration: 3.9,
    transmission: "Single-speed",
    fuelType: "Electric",
    image: realisticVehicleArt.electric,
    heroImage: realisticVehicleArt.electric,
    imagePlaceholder: realisticVehicleArt.electric,
    description:
      "Silent electric performance wrapped in considered, contemporary comfort.",
    available: true,
  },
  {
    id: "vantage-gt",
    slug: "vantage-gt",
    name: "Vantage GT",
    brand: "Caldera",
    category: "sport",
    type: "Grand tourer",
    pricePerDay: 680,
    seats: 2,
    rating: 5,
    horsepower: 610,
    acceleration: 3.4,
    transmission: "Dual-clutch",
    fuelType: "Petrol",
    image: realisticVehicleArt.sport,
    heroImage: realisticVehicleArt.sport,
    imagePlaceholder: realisticVehicleArt.sport,
    description:
      "A focused, sculptural coupe with a naturally engaging road presence.",
    available: true,
  },
  {
    id: "monarch-l",
    slug: "monarch-l",
    name: "Monarch L",
    brand: "Belmont",
    category: "sedan",
    type: "Executive sedan",
    pricePerDay: 510,
    seats: 5,
    rating: 4.9,
    horsepower: 460,
    acceleration: 4.6,
    transmission: "Automatic",
    fuelType: "Hybrid",
    image: realisticVehicleArt.sedan,
    heroImage: realisticVehicleArt.sedan,
    imagePlaceholder: realisticVehicleArt.sedan,
    description:
      "A spacious executive saloon that makes every arrival feel unhurried.",
    available: false,
  },
  {
    id: "velocity-rs",
    slug: "velocity-rs",
    name: "Velocity RS",
    brand: "Solstice",
    category: "convertible",
    type: "Performance convertible",
    pricePerDay: 590,
    seats: 2,
    rating: 4.9,
    horsepower: 540,
    acceleration: 3.8,
    transmission: "Dual-clutch",
    fuelType: "Petrol",
    image: realisticVehicleArt.convertible,
    heroImage: realisticVehicleArt.convertible,
    imagePlaceholder: realisticVehicleArt.convertible,
    description:
      "Open-air performance designed for bright mornings and winding roads.",
    available: true,
  },
];

export const heroCategoryVehicleIds: Record<HeroCategory, string> = {
  sport: "vantage-gt",
  suv: "atlas-x7",
  sedan: "monarch-l",
  electric: "aurora-s",
};

export function getHeroVehicle(category: HeroCategory): HeroVehicle {
  const vehicleId = heroCategoryVehicleIds[category];
  const vehicle = vehicles.find(({ id }) => id === vehicleId);

  if (!vehicle || !isHeroVehicleForCategory(vehicle, category)) {
    throw new Error(
      `Hero category "${category}" references an invalid vehicle "${vehicleId}".`,
    );
  }

  return vehicle;
}

function isHeroVehicleForCategory(
  vehicle: Vehicle,
  category: HeroCategory,
): vehicle is HeroVehicle {
  return vehicle.category === category;
}
