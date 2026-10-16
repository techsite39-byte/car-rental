import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { VehicleDetailRoute } from "@/components/fleet/VehicleDetailRoute";
import { fleetVehicles as vehicles, type Vehicle } from "@/data/vehicles";

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
  const origin = process.env.BOOKING_API_URL?.trim() || "http://localhost:5000";
  try {
    const response = await fetch(
      new URL(`/api/fleet/${encodeURIComponent(slug)}`, `${origin.replace(/\/+$/, "")}/`),
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
