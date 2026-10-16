import type { Vehicle } from "@/data/vehicles";

interface VehicleSpecsProps {
  vehicle: Vehicle;
}

export function VehicleSpecs({ vehicle }: VehicleSpecsProps) {
  const specs = [
    { label: "SEATS", value: String(vehicle.seats) },
    { label: "FUEL TYPE", value: vehicle.fuelType },
    { label: "CATEGORY", value: vehicle.type },
    { label: "STARTING PRICE / DAY", value: `₹${vehicle.pricePerDay.toLocaleString("en-IN")}` },
  ];

  return (
    <section
      aria-label={`${vehicle.name} specifications`}
      className="vehicle-specs"
      data-detail-reveal
    >
      <div className="site-container vehicle-specs__grid">
        {specs.map(({ label, value }) => (
          <div className="vehicle-specs__item" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
