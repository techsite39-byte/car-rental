import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import fleetSeeds from "../../../data/vehicles.json" with { type: "json" };
import showcaseSeeds from "../../../data/original-vehicles.json" with { type: "json" };
import FleetVehicle from "../models/FleetVehicle.js";

const categories = new Set([
  "sport",
  "suv",
  "sedan",
  "electric",
  "convertible",
  "mpv",
  "hatchback",
]);
const categoryLabels = {
  sport: "Sport",
  suv: "SUV",
  sedan: "Sedan",
  electric: "Electric",
  convertible: "Convertible",
  mpv: "MPV",
  hatchback: "Hatchback",
};
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class FleetInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "FleetInputError";
    this.statusCode = 422;
  }
}

function text(value, field, maxLength, { optional = false } = {}) {
  if (optional && value === undefined) return "";
  if (typeof value !== "string") {
    throw new FleetInputError(`${field} must be text.`);
  }
  const result = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim();
  if (result.length > maxLength) {
    throw new FleetInputError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return result;
}

function optionalNumber(value, field, { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new FleetInputError(`${field} must be a valid number.`);
  }
  return number;
}

function validateVehicleInput(input, { existing = null, isNew = false } = {}) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new FleetInputError("Vehicle details must be a JSON object.");
  }

  const brand = text(input.brand, "Brand", 80);
  const model = text(input.model, "Model", 100);
  const name = text(input.name, "Display name", 120);
  const slug = text(input.slug, "Slug", 120).toLowerCase();
  const category = input.category;
  const pricePerDay = optionalNumber(input.pricePerDay, "Daily price", {
    minimum: 1,
    maximum: 10_000_000,
  });
  const seats = optionalNumber(input.seats, "Seating capacity", {
    minimum: 1,
    maximum: 20,
  });
  const transmission = text(input.transmission ?? "", "Transmission", 50);
  const fuelType = text(input.fuelType, "Fuel type", 50);
  const description = text(input.description, "Description", 3000);
  const image = text(input.image ?? "", "Image URL", 2048);

  if (!brand || !model || !name || !description || !fuelType) {
    throw new FleetInputError("Brand, model, name, fuel type, and description are required.");
  }
  if (!slugPattern.test(slug)) {
    throw new FleetInputError("Enter a valid URL slug using lowercase letters, numbers, and hyphens.");
  }
  if (!categories.has(category)) {
    throw new FleetInputError("Choose a valid vehicle category.");
  }
  if (!Number.isSafeInteger(pricePerDay) || !Number.isSafeInteger(seats)) {
    throw new FleetInputError("Daily price and seating capacity must be whole numbers.");
  }
  if (input.available !== undefined && typeof input.available !== "boolean") {
    throw new FleetInputError("Availability must be true or false.");
  }
  if (input.featured !== undefined && typeof input.featured !== "boolean") {
    throw new FleetInputError("Featured status must be true or false.");
  }
  if (input.showInFleet !== undefined && typeof input.showInFleet !== "boolean") {
    throw new FleetInputError("Fleet visibility must be true or false.");
  }
  if (image && !image.startsWith("/") && !/^https:\/\//i.test(image)) {
    throw new FleetInputError("Vehicle images must use a local path or HTTPS URL.");
  }

  const vehicle = {
    brand,
    model,
    name,
    slug,
    category,
    type:
      text(input.type ?? existing?.type ?? categoryLabels[category], "Vehicle type", 80) ||
      categoryLabels[category],
    pricePerDay,
    seats,
    transmission,
    fuelType,
    description,
    image,
    heroImage: image,
    imagePlaceholder: image,
    available: input.available ?? existing?.available ?? true,
    featured: input.featured ?? existing?.featured ?? false,
    showInFleet: input.showInFleet ?? existing?.showInFleet ?? true,
  };

  for (const field of ["rating", "horsepower", "acceleration"]) {
    const value = optionalNumber(input[field], field, {
      minimum: field === "rating" ? 0 : 0.1,
      maximum: field === "rating" ? 5 : 10_000,
    });
    if (value !== undefined) vehicle[field] = value;
    else if (existing?.[field] !== undefined && !isNew) {
      vehicle[field] = existing[field];
    }
  }

  return vehicle;
}

function seedVehicle(vehicle, showInFleet) {
  return {
    ...vehicle,
    heroImage: vehicle.heroImage ?? vehicle.image,
    imagePlaceholder: vehicle.imagePlaceholder ?? vehicle.image,
    showInFleet,
  };
}

async function ensureFleetSeeded() {
  await FleetVehicle.init();
  const records = [
    ...fleetSeeds.map((vehicle) => seedVehicle(vehicle, true)),
    ...showcaseSeeds.map((vehicle) => seedVehicle(vehicle, false)),
  ];
  await FleetVehicle.bulkWrite(
    records.map((vehicle) => ({
      updateOne: {
        filter: { slug: vehicle.slug },
        update: { $setOnInsert: vehicle },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  // Migrate only legacy seeded rows. Once a row uses the current local asset,
  // admin-managed edits are left untouched on later requests.
  await FleetVehicle.bulkWrite(
    fleetSeeds.map((vehicle) => {
      const seeded = seedVehicle(vehicle, true);
      return {
        updateOne: {
          filter: {
            slug: seeded.slug,
            image: /^\/images\/vehicles\//,
          },
          update: { $set: seeded },
        },
      };
    }),
    { ordered: false },
  );
}

function serializeVehicle(vehicle) {
  const record = vehicle.toObject ? vehicle.toObject() : vehicle;
  return { ...record, id: record.id ?? String(record._id) };
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

async function findVehicle(identifier) {
  const clauses = [{ id: identifier }, { slug: identifier }];
  if (mongoose.isValidObjectId(identifier)) clauses.push({ _id: identifier });
  return FleetVehicle.findOne({ archived: { $ne: true }, $or: clauses });
}

async function listFleet(_req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: "Fleet data is temporarily unavailable." });
    }
    await ensureFleetSeeded();
    const query = { archived: { $ne: true } };
    if (_req.query.includeHidden !== "true") query.showInFleet = true;
    const vehicles = await FleetVehicle.find(query)
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({
      vehicles: vehicles.map((vehicle) => serializeVehicle(vehicle)),
    });
  } catch (error) {
    return next(error);
  }
}

async function getFleetVehicle(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: "Fleet data is temporarily unavailable." });
    }
    await ensureFleetSeeded();
    const vehicle = await findVehicle(req.params.identifier);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found." });
    return res.status(200).json({ vehicle: serializeVehicle(vehicle) });
  } catch (error) {
    return next(error);
  }
}

async function createFleetVehicle(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: "Fleet data is temporarily unavailable." });
    }
    await ensureFleetSeeded();
    const vehicle = validateVehicleInput(req.body, { isNew: true });
    const saved = await FleetVehicle.create({ id: randomUUID(), ...vehicle });
    return res.status(201).json({ vehicle: serializeVehicle(saved) });
  } catch (error) {
    return next(error);
  }
}

async function updateFleetVehicle(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: "Fleet data is temporarily unavailable." });
    }
    await ensureFleetSeeded();
    const existing = await findVehicle(req.params.identifier);
    if (!existing) return res.status(404).json({ error: "Vehicle not found." });
    const vehicle = validateVehicleInput(req.body, { existing });
    const saved = await FleetVehicle.findByIdAndUpdate(
      existing._id,
      { $set: vehicle },
      { returnDocument: "after", runValidators: true },
    );
    return res.status(200).json({ vehicle: serializeVehicle(saved) });
  } catch (error) {
    return next(error);
  }
}

async function deleteFleetVehicle(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: "Fleet data is temporarily unavailable." });
    }
    await ensureFleetSeeded();
    const vehicle = await findVehicle(req.params.identifier);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found." });
    await FleetVehicle.updateOne(
      { _id: vehicle._id },
      { $set: { archived: true, available: false, showInFleet: false } },
    );
    return res.status(200).json({ deleted: true, id: vehicle.id });
  } catch (error) {
    return next(error);
  }
}

export {
  FleetInputError,
  createFleetVehicle,
  deleteFleetVehicle,
  ensureFleetSeeded,
  getFleetVehicle,
  listFleet,
  serializeVehicle,
  updateFleetVehicle,
  validateVehicleInput,
};
