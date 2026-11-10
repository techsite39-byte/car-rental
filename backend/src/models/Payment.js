import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, trim: true, default: "" },
    bookingReference: { type: String, required: true, index: true, trim: true },
    customerId: { type: String, trim: true, default: "" },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, enum: ["INR"], default: "INR" },
    paymentMethod: { type: String, trim: true, default: "razorpay" },
    gatewayTransactionId: { type: String, trim: true, default: "" },
    gatewayOrderId: { type: String, required: true, unique: true, trim: true },
    gatewaySignature: { type: String, select: false, trim: true, default: "" },
    paymentStatus: {
      type: String,
      enum: ["created", "verified", "failed"],
      default: "created",
    },
    paymentDate: { type: Date, default: null },
    whatsappStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "not_configured"],
      default: "pending",
    },
    whatsappMessageId: { type: String, trim: true, default: "" },
    whatsappError: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true, versionKey: false },
);

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
