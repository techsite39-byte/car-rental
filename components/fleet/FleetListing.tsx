"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FleetFilters } from "@/components/fleet/FleetFilters";
import { VehicleCard } from "@/components/fleet/VehicleCard";
import { vehicles as seedVehicles, type FleetCategory } from "@/data/vehicles";
import { adminRepositories } from "@/lib/admin-data";
import { useAdminCollection } from "@/lib/use-admin-collection";

const categories: FleetCategory[] = [
  "all",
  "sport",
  "suv",
  "sedan",
  "electric",
  "convertible",
];

export default function FleetListing() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("category");
  const initialCategory =
    categories.find((candidate) => candidate === requested) ?? "all";
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
          <p>THE VÉLOCE COLLECTION</p>
          <h1>Find your perfect drive.</h1>
          <span>
            Explore the vehicles currently listed in our local fleet catalogue.
          </span>
        </header>
        <FleetFilters onCategoryChange={setCategory} selectedCategory={category} />
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
