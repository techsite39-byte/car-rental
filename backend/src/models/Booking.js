import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bookingId: { type: String, required: true, unique: true, sparse: true, trim: true },
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
    vehicleDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
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
    pickupPreference: {
      type: String,
      enum: ["self", "delivery"],
      default: "self",
    },
    documents: {
      originalProof: { type: String, trim: true, maxlength: 80, default: "" },
      professionalProof: { type: String, trim: true, maxlength: 80, default: "" },
      idProof: { type: String, trim: true, maxlength: 80, default: "" },
    },
    baseTariff: { type: Number, required: true, min: 0 },
    pickupCharges: { type: Number, required: true, min: 0, default: 0 },
    dropCharges: { type: Number, required: true, min: 0, default: 0 },
    securityDeposit: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, required: true, min: 500, default: 500 },
    remainingAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "failed"],
      default: "pending",
    },
    whatsappStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "not_configured"],
      default: "pending",
    },
    whatsappMessageId: { type: String, trim: true, default: "" },
    whatsappError: { type: String, trim: true, maxlength: 500, default: "" },
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
