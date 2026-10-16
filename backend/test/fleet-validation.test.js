import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FleetInputError,
  validateVehicleInput,
} from "../src/controllers/fleetController.js";

function validVehicle(overrides = {}) {
  return {
    brand: "Maruti Suzuki",
    model: "Brezza",
    name: "Maruti Suzuki Brezza",
    slug: "maruti-brezza",
    category: "suv",
    pricePerDay: 2500,
    seats: 5,
    horsepower: 103,
    acceleration: 12.5,
    transmission: "Automatic",
    fuelType: "Petrol",
    description: "A five-seat vehicle for daily trips.",
    image: "https://images.example.test/brezza.jpg",
    available: true,
    featured: false,
    ...overrides,
  };
}

test("sanitizes editable vehicle fields and derives image variants", () => {
  const vehicle = validateVehicleInput(
    validVehicle({ name: "  Maruti\nSuzuki Brezza  ", slug: "MARUTI-BREZZA" }),
  );

  assert.equal(vehicle.name, "Maruti Suzuki Brezza");
  assert.equal(vehicle.slug, "maruti-brezza");
  assert.equal(vehicle.image, vehicle.heroImage);
  assert.equal(vehicle.image, vehicle.imagePlaceholder);
  assert.equal(vehicle.type, "SUV");
});

test("preserves existing optional metadata when omitted on update", () => {
  const vehicle = validateVehicleInput(validVehicle(), {
    existing: { rating: 4.8, showInFleet: false, type: "Luxury SUV" },
  });

  assert.equal(vehicle.rating, 4.8);
  assert.equal(vehicle.showInFleet, false);
  assert.equal(vehicle.type, "Luxury SUV");
});

test("rejects invalid prices, category, slug, and image protocols", () => {
  for (const overrides of [
    { pricePerDay: 0 },
    { category: "truck" },
    { slug: "Invalid Slug" },
    { image: "javascript:alert(1)" },
  ]) {
    assert.throws(
      () => validateVehicleInput(validVehicle(overrides)),
      FleetInputError,
    );
  }
});