"use client";

import Link from "next/link";
import { vehicles as seedVehicles } from "@/data/vehicles";
import { adminRepositories } from "@/lib/admin-data";
import { useAdminCollection } from "@/lib/use-admin-collection";
import { VehicleDetail } from "@/components/fleet/VehicleDetail";

export function VehicleDetailRoute({ slug }: { slug: string }) {
  const { items: vehicles, error } = useAdminCollection(
    adminRepositories.vehicles,
    seedVehicles,
  );
  const vehicle = vehicles.find((item) => item.slug === slug);

  if (error) {
    return <main className="site-container fleet-route-message" role="alert">{error}</main>;
  }
  if (!vehicle) {
    return (
      <main className="site-container fleet-route-message">
        <p className="fleet-route-message__eyebrow">VEHICLE UNAVAILABLE</p>
        <h1>This vehicle is not in the current fleet.</h1>
        <Link className="button button--primary button--md" href="/fleet">Explore fleet</Link>
      </main>
    );
  }
  return <VehicleDetail fleetVehicles={vehicles} vehicle={vehicle} />;
}
