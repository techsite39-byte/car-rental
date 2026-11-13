import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { VehicleDetailRoute } from "@/components/fleet/VehicleDetailRoute";
import { fleetVehicles as vehicles, type Vehicle } from "@/data/vehicles";
import {
  BACKEND_API_URL_ERROR,
  getBackendApiUrl,
} from "@/lib/backend-api-url";

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return vehicles.map(({ slug }) => ({ slug }));
}

async function getSavedVehicle(slug: string): Promise<Vehicle | undefined> {
  "use cache";
  cacheLife("minutes");
  cacheTag("fleet");
  const backendUrl = getBackendApiUrl(
    `/api/fleet/${encodeURIComponent(slug)}`,
  );
  if (!backendUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(BACKEND_API_URL_ERROR);
    }
    return undefined;
  }
  try {
    const response = await fetch(
      backendUrl,
      { signal: AbortSignal.timeout(5_000) },
    );
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok || typeof payload !== "object" || payload === null || !("vehicle" in payload)) {
      return undefined;
    }
    return payload.vehicle as Vehicle;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle =
    (await getSavedVehicle(slug)) ??
    vehicles.find((candidate) => candidate.slug === slug);

  if (!vehicle) {
    return { title: "Vehicle not found — EPICDRIVE" };
  }

  return {
    title: `${vehicle.name} — EPICDRIVE Car Rentals`,
    description: `${vehicle.description} Book with EPICDRIVE Car Rentals in Madurai.`,
  };
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { slug } = await params;
  return <VehicleDetailRoute slug={slug} />;
}
