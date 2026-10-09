import type { Vehicle } from "@/data/vehicles";

interface VehicleSpecsProps {
  vehicle: Vehicle;
}

export function VehicleSpecs({ vehicle }: VehicleSpecsProps) {
  const specs = [
    { label: "0–100 KM/H", value: `${vehicle.acceleration.toFixed(1)}s` },
    { label: "POWER", value: `${vehicle.horsepower} HP` },
    { label: "SEATS", value: String(vehicle.seats) },
    { label: "TRANSMISSION", value: vehicle.transmission },
    { label: "FUEL TYPE", value: vehicle.fuelType },
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
