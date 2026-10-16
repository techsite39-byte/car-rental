"use client";

import Link from "next/link";
import { fleetVehicles as seedVehicles } from "@/data/vehicles";
import { useFleetCollection } from "@/lib/use-fleet-collection";
import { VehicleDetail } from "@/components/fleet/VehicleDetail";

export function VehicleDetailRoute({ slug }: { slug: string }) {
  const { items, error } = useFleetCollection(seedVehicles);
  const vehicles = items.filter((item) => item.showInFleet !== false);
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
