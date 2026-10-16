import mongoose from "mongoose";

const fleetVehicleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    brand: { type: String, required: true, trim: true, maxlength: 80 },
    model: { type: String, required: true, trim: true, maxlength: 100 },
    category: {
      type: String,
      required: true,
      enum: ["sport", "suv", "sedan", "electric", "convertible", "mpv", "hatchback"],
    },
    type: { type: String, required: true, trim: true, maxlength: 80 },
    pricePerDay: { type: Number, required: true, min: 1 },
    seats: { type: Number, required: true, min: 1, max: 20 },
    rating: { type: Number, min: 0, max: 5 },
    horsepower: { type: Number, min: 1 },
    acceleration: { type: Number, min: 0.1 },
    transmission: { type: String, trim: true, maxlength: 50, default: "" },
    fuelType: { type: String, required: true, trim: true, maxlength: 50 },
    image: { type: String, trim: true, maxlength: 2048, default: "" },
    heroImage: { type: String, trim: true, maxlength: 2048, default: "" },
    imagePlaceholder: { type: String, trim: true, maxlength: 2048, default: "" },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    available: { type: Boolean, required: true, default: true },
    featured: { type: Boolean, default: false },
    showInFleet: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
  },
  { collection: "fleet", timestamps: true, versionKey: false, strict: false },
);

const FleetVehicle =
  mongoose.models.FleetVehicle ||
  mongoose.model("FleetVehicle", fleetVehicleSchema);

export default FleetVehicle;