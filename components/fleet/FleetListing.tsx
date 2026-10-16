"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FleetFilters,
  fleetFilterCategories,
} from "@/components/fleet/FleetFilters";
import { VehicleCard } from "@/components/fleet/VehicleCard";
import { fleetVehicles as seedVehicles } from "@/data/vehicles";
import { adminRepositories } from "@/lib/admin-data";
import { useAdminCollection } from "@/lib/use-admin-collection";

export default function FleetListing() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("category");
  const initialCategory =
    fleetFilterCategories.find((candidate) => candidate.value === requested)
      ?.value ?? "all";
  const [category, setCategory] = useState(initialCategory);
  const { items: vehicles, error } = useAdminCollection(
    adminRepositories.vehicles,
    seedVehicles,
  );
  const visible = useMemo(
    () =>
      vehicles.filter(
        (vehicle) => category === "all" || vehicle.category === category,
      ),
    [category, vehicles],
  );

  return (
    <main className="fleet-page">
      <div className="site-container">
        <header className="fleet-page__header">
          <p>THE EPICDRIVE FLEET</p>
          <h1>Find your perfect drive.</h1>
          <span>
            Starting rates and specifications follow the supplied fleet list.
            Confirm the exact vehicle variant and rental details with EPICDRIVE.
          </span>
        </header>
        <FleetFilters
          categories={fleetFilterCategories}
          onCategoryChange={setCategory}
          selectedCategory={category}
        />
        {error ? (
          <p className="fleet-route-message" role="alert">
            {error}
          </p>
        ) : null}
        {visible.length ? (
          <div className="fleet-grid">
            {visible.map((vehicle, index) => (
              <VehicleCard
                featured={vehicle.featured ?? index === 0}
                key={vehicle.id}
                vehicle={vehicle}
              />
            ))}
          </div>
        ) : (
          <div className="fleet-page__empty">
            <h2>No vehicles in this category yet.</h2>
            <p>Choose another category to explore the current fleet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
