import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    accessTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    vehicleId: { type: String, required: true, trim: true },
    vehicleName: { type: String, required: true, trim: true },
    pickupLocation: { type: String, required: true, trim: true, maxlength: 120 },
    returnLocation: { type: String, required: true, trim: true, maxlength: 120 },
    pickupDateTime: { type: Date, required: true },
    returnDateTime: { type: Date, required: true },
    rentalDurationDays: { type: Number, required: true, min: 1 },
    startingDailyRate: { type: Number, required: true, min: 0 },
    estimatedTotal: { type: Number, required: true, min: 0 },
    rentalType: {
      type: String,
      required: true,
      enum: ["self-drive", "chauffeur"],
    },
    roundTrip: { type: Boolean, required: true },
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 30 },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    additionalRequests: { type: String, trim: true, maxlength: 1000, default: "" },
    status: {
      type: String,
      required: true,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true, versionKey: false },
);

bookingSchema.pre("validate", function validateBookingDates() {
  if (
    this.pickupDateTime instanceof Date &&
    this.returnDateTime instanceof Date &&
    this.returnDateTime <= this.pickupDateTime
  ) {
    this.invalidate("returnDateTime", "Return must be after pick-up.");
  }
});

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
