"use client";

import type { FleetCategory } from "@/data/vehicles";

interface FleetFiltersProps {
  selectedCategory: FleetCategory;
  onCategoryChange: (category: FleetCategory) => void;
  categories: { value: FleetCategory; label: string }[];
}

export const fleetFilterCategories: FleetFiltersProps["categories"] = [
  { value: "all", label: "All" },
  { value: "mpv", label: "MPV" },
  { value: "suv", label: "SUV" },
  { value: "sedan", label: "Sedan" },
  { value: "hatchback", label: "Hatchback" },
  { value: "sport", label: "Sport" },
  { value: "electric", label: "Electric" },
  { value: "convertible", label: "Convertible" },
];

export function FleetFilters({
  selectedCategory,
  onCategoryChange,
  categories,
}: FleetFiltersProps) {
  return (
    <div
      aria-label="Filter vehicles by category"
      className="fleet-filters"
      role="group"
    >
      {categories.map(({ value, label }) => (
        <button
          aria-pressed={selectedCategory === value}
          className="fleet-filters__button"
          key={value}
          onClick={() => onCategoryChange(value)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
