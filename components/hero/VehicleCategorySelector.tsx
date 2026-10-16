import type { HeroCategory, HeroVehicle } from "@/data/vehicles";

const categories: Array<{ id: HeroCategory; label: string }> = [
  { id: "suv", label: "SUV" },
  { id: "sedan", label: "Sedan" },
  { id: "mpv", label: "MPV" },
  { id: "hatchback", label: "Hatchback" },
];

interface VehicleCategorySelectorProps {
  activeCategory: HeroCategory;
  onCategoryChange: (category: HeroCategory) => void;
  vehicles: HeroVehicle[];
  activeVehicleId: string;
  onVehicleChange: (vehicleId: string) => void;
}

export function VehicleCategorySelector({
  activeCategory,
  onCategoryChange,
  vehicles,
  activeVehicleId,
  onVehicleChange,
}: VehicleCategorySelectorProps) {
  const categoryVehicles = vehicles.filter(
    (vehicle) => vehicle.category === activeCategory,
  );

  return (
    <div className="hero-category" data-hero-controls>
      <p className="hero-category__label">Choose a class</p>
      <div aria-label="Vehicle class" className="hero-category__list" role="group">
        {categories.map(({ id, label }) => {
          const isActive = activeCategory === id;

          return (
            <button
              aria-pressed={isActive}
              className="hero-category__option"
              key={id}
              onClick={() => onCategoryChange(id)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>
      <label className="hero-category__vehicle">
        <span className="visually-hidden">Choose a vehicle</span>
        <select
          aria-label="Choose a vehicle"
          onChange={(event) => onVehicleChange(event.target.value)}
          value={activeVehicleId}
        >
          {categoryVehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
