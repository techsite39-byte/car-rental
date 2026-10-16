import type { Metadata } from "next";
import { VehicleDetailRoute } from "@/components/fleet/VehicleDetailRoute";
import { fleetVehicles as vehicles } from "@/data/vehicles";

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return vehicles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = vehicles.find((candidate) => candidate.slug === slug);

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
