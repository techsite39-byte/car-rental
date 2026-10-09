"use client";

import type { FleetCategory } from "@/data/vehicles";

interface FleetFiltersProps {
  selectedCategory: FleetCategory;
  onCategoryChange: (category: FleetCategory) => void;
}

const categories: { value: FleetCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sport", label: "Sport" },
  { value: "suv", label: "SUV" },
  { value: "sedan", label: "Sedan" },
  { value: "electric", label: "Electric" },
  { value: "convertible", label: "Convertible" },
];

export function FleetFilters({
  selectedCategory,
  onCategoryChange,
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
