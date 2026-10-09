import type { HeroCategory } from "@/data/vehicles";

const categories: Array<{ id: HeroCategory; label: string }> = [
  { id: "sport", label: "Sport" },
  { id: "suv", label: "SUV" },
  { id: "sedan", label: "Sedan" },
  { id: "electric", label: "Electric" },
];

interface VehicleCategorySelectorProps {
  activeCategory: HeroCategory;
  onCategoryChange: (category: HeroCategory) => void;
}

export function VehicleCategorySelector({
  activeCategory,
  onCategoryChange,
}: VehicleCategorySelectorProps) {
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
    </div>
  );
}
