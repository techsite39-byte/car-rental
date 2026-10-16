"use client";

import { useEffect, useState } from "react";
import type { Vehicle } from "@/data/vehicles";

function isVehicle(value: unknown): value is Vehicle {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const vehicle = value as Record<string, unknown>;
  return (
    typeof vehicle.id === "string" &&
    typeof vehicle.slug === "string" &&
    typeof vehicle.name === "string" &&
    typeof vehicle.brand === "string" &&
    typeof vehicle.category === "string" &&
    typeof vehicle.type === "string" &&
    typeof vehicle.pricePerDay === "number" &&
    typeof vehicle.seats === "number" &&
    typeof vehicle.fuelType === "string" &&
    typeof vehicle.image === "string" &&
    typeof vehicle.description === "string" &&
    typeof vehicle.available === "boolean"
  );
}

export function notifyFleetChange() {
  window.dispatchEvent(new Event("epicdrive-fleet-data"));
}

export function useFleetCollection(
  seed: Vehicle[],
  { includeHidden = false }: { includeHidden?: boolean } = {},
) {
  const [items, setItems] = useState<Vehicle[]>(seed);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function refresh() {
      try {
        const response = await fetch("/api/fleet", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload: unknown = await response.json().catch(() => null);
        const records =
          typeof payload === "object" && payload !== null && "vehicles" in payload
            ? payload.vehicles
            : null;
        if (!response.ok) {
          const message =
            typeof payload === "object" && payload !== null && "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "Fleet data is temporarily unavailable.";
          throw new Error(message);
        }
        if (!Array.isArray(records) || !records.every(isVehicle)) {
          throw new Error("Fleet service returned invalid vehicle data.");
        }
        if (!active) return;
        setItems(
          includeHidden
            ? records
            : records.filter((vehicle) => vehicle.showInFleet !== false),
        );
        setError("");
      } catch (cause) {
        if (!active || (cause instanceof DOMException && cause.name === "AbortError")) {
          return;
        }
        setError(
          cause instanceof Error
            ? cause.message
            : "Fleet data is temporarily unavailable.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void refresh();
    window.addEventListener("epicdrive-fleet-data", refresh);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("epicdrive-fleet-data", refresh);
    };
  }, [includeHidden]);

  return { items, error, loading };
}