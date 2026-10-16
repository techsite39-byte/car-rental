import { deals as seedDeals, type Deal } from "@/data/deals";
import { fleetVehicles as seedVehicles, type Vehicle } from "@/data/vehicles";
import type { DriverPreference } from "@/lib/booking";

export type BookingStatus = "pending" | "reviewed" | "cancelled";
export type EnquiryStatus = "new" | "in-progress" | "resolved";

export interface BookingRequest {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  vehicleId: string;
  vehicleName: string;
  vehicleSlug: string;
  pickupLocation: string;
  returnLocation: string;
  pickupDate: string;
  returnDate: string;
  driverPreference: DriverPreference;
  submittedAt: string;
  status: BookingStatus;
}

export interface ContactEnquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  submittedAt: string;
  status: EnquiryStatus;
}

export interface ManagedDeal extends Deal {
  slug: string;
  active: boolean;
}

export interface Repository<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  save(item: T): void;
  delete(id: string): void;
}

export type VehicleRepository = Repository<Vehicle>;
export type BookingRepository = Repository<BookingRequest>;
export type EnquiryRepository = Repository<ContactEnquiry>;
export type DealRepository = Repository<ManagedDeal>;

const STORAGE_KEYS = {
  vehicles: "epicdrive-admin-vehicles-v2",
  bookings: "veloce-admin-bookings-v1",
  enquiries: "veloce-admin-enquiries-v1",
  deals: "veloce-admin-deals-v1",
} as const;

const demoDeals: ManagedDeal[] = seedDeals.map((deal) => ({
  ...deal,
  slug: deal.id,
  active: true,
}));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isVehicleCategory(
  value: unknown,
): value is Vehicle["category"] {
  return (
    value === "mpv" ||
    value === "suv" ||
    value === "sedan" ||
    value === "hatchback"
  );
}

function isVehicle(value: unknown): value is Vehicle {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.name === "string" &&
    typeof value.brand === "string" &&
    isVehicleCategory(value.category) &&
    typeof value.pricePerDay === "number" &&
    typeof value.seats === "number" &&
    (value.horsepower === undefined || typeof value.horsepower === "number") &&
    (value.acceleration === undefined || typeof value.acceleration === "number") &&
    (value.transmission === undefined ||
      typeof value.transmission === "string") &&
    typeof value.fuelType === "string" &&
    typeof value.image === "string" &&
    typeof value.description === "string" &&
    typeof value.available === "boolean"
  );
}

function isBooking(value: unknown): value is BookingRequest {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.customerName === "string" &&
    typeof value.email === "string" &&
    typeof value.vehicleId === "string" &&
    typeof value.vehicleName === "string" &&
    typeof value.vehicleSlug === "string" &&
    typeof value.pickupLocation === "string" &&
    typeof value.returnLocation === "string" &&
    typeof value.pickupDate === "string" &&
    typeof value.returnDate === "string" &&
    (value.driverPreference === "self-drive" ||
      value.driverPreference === "chauffeur") &&
    typeof value.submittedAt === "string" &&
    (value.status === "pending" ||
      value.status === "reviewed" ||
      value.status === "cancelled")
  );
}

function isEnquiry(value: unknown): value is ContactEnquiry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.subject === "string" &&
    typeof value.message === "string" &&
    typeof value.submittedAt === "string" &&
    (value.status === "new" ||
      value.status === "in-progress" ||
      value.status === "resolved")
  );
}

function isManagedDeal(value: unknown): value is ManagedDeal {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.discount === "number" &&
    typeof value.badge === "string" &&
    typeof value.validity === "string" &&
    typeof value.image === "string" &&
    typeof value.terms === "string" &&
    typeof value.active === "boolean"
  );
}

function notifyChange() {
  window.dispatchEvent(new Event("epicdrive-admin-data"));
}

function createBrowserRepository<T extends { id: string }>(
  key: string,
  seed: T[],
  isItem: (value: unknown) => value is T,
): Repository<T> {
  function list(): T[] {
    const serialized = window.localStorage.getItem(key);
    if (serialized === null) return [...seed];

    let parsed: unknown;
    try {
      parsed = JSON.parse(serialized);
    } catch {
      throw new Error(`Saved local data for "${key}" is not valid JSON.`);
    }
    if (!Array.isArray(parsed) || !parsed.every(isItem)) {
      throw new Error(`Saved local data for "${key}" has an invalid shape.`);
    }
    return parsed;
  }

  function saveAll(items: T[]) {
    window.localStorage.setItem(key, JSON.stringify(items));
    notifyChange();
  }

  return {
    list,
    get(id) {
      return list().find((item) => item.id === id);
    },
    save(item) {
      const items = list();
      const index = items.findIndex(({ id }) => id === item.id);
      if (index < 0) items.unshift(item);
      else items[index] = item;
      saveAll(items);
    },
    delete(id) {
      saveAll(list().filter((item) => item.id !== id));
    },
  };
}

const vehiclesRepository = createBrowserRepository(
  STORAGE_KEYS.vehicles,
  seedVehicles,
  isVehicle,
);
const bookingsRepository = createBrowserRepository<BookingRequest>(
  STORAGE_KEYS.bookings,
  [],
  isBooking,
);
const enquiriesRepository = createBrowserRepository<ContactEnquiry>(
  STORAGE_KEYS.enquiries,
  [],
  isEnquiry,
);
const dealsRepository = createBrowserRepository(
  STORAGE_KEYS.deals,
  demoDeals,
  isManagedDeal,
);

export const adminRepositories: {
  vehicles: VehicleRepository;
  bookings: BookingRepository;
  enquiries: EnquiryRepository;
  deals: DealRepository;
} = {
  vehicles: vehiclesRepository,
  bookings: bookingsRepository,
  enquiries: enquiriesRepository,
  deals: dealsRepository,
};

export function createRecordId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
