import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import vehicles from "../../../data/vehicles.json" with { type: "json" };
import originalVehicles from "../../../data/original-vehicles.json" with { type: "json" };
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import FleetVehicle from "../models/FleetVehicle.js";
import { ensureFleetSeededIfNeeded } from "./fleetController.js";
import { sendWhatsAppConfirmation } from "../services/whatsapp.js";

const DAY_MS = 86_400_000;
const ADVANCE_AMOUNT = 500;
const bookingVehicles = [...vehicles, ...originalVehicles];
const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class BookingInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "BookingInputError";
    this.statusCode = 422;
  }
}

function readText(value, fieldName, maxLength, { optional = false } = {}) {
  if (value === undefined && optional) return "";
  if (typeof value !== "string") {
    throw new BookingInputError(`${fieldName} must be text.`);
  }
  const text = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim();
  if (text.length > maxLength) {
    throw new BookingInputError(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function readDateTime(value, fieldName) {
  if (typeof value !== "string") {
    throw new BookingInputError(`Enter a valid ${fieldName} date and time.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
    throw new BookingInputError(`Enter a valid ${fieldName} date and time.`);
  }
  return date;
}

function validateBookingInput(input, idempotencyKey, fleet = bookingVehicles) {
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey ?? "")) {
    throw new BookingInputError("Refresh the page and submit your booking again.");
  }
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new BookingInputError("Booking details must be a JSON object.");
  }

  const customerName = readText(input.customerName, "Customer name", 120);
  const phone = readText(input.phone, "Phone number", 30);
  const email = readText(input.email, "Email address", 254).toLowerCase();
  const vehicleId = readText(input.vehicleId, "Vehicle", 80);
  const pickupLocation = readText(input.pickupLocation, "Pick-up location", 120);
  const returnLocation = readText(input.returnLocation, "Return location", 120);
  const additionalRequests = readText(
    input.additionalRequests,
    "Additional requests",
    1000,
    { optional: true },
  );
  const documentsInput = input.documents && typeof input.documents === "object"
    ? input.documents
    : {};
  const documents = {
    originalProof: readText(documentsInput.originalProof, "Original proof", 80, { optional: true }),
    professionalProof: readText(documentsInput.professionalProof, "Professional proof", 80, { optional: true }),
    idProof: readText(documentsInput.idProof, "ID proof", 80, { optional: true }),
  };
  const pickupPreference = input.pickupPreference === "delivery" ? "delivery" : "self";

  if (customerName.length < 2) {
    throw new BookingInputError("Enter a valid customer name.");
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (!/^\+?[0-9\s().-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    throw new BookingInputError("Enter a valid phone number.");
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new BookingInputError("Enter a valid email address.");
  }
  if (!pickupLocation || !returnLocation) {
    throw new BookingInputError("Enter pick-up and return locations.");
  }

  const pickupDateTime = readDateTime(input.pickupDateTime, "pick-up");
  const returnDateTime = readDateTime(input.returnDateTime, "return");
  const durationMs = returnDateTime.getTime() - pickupDateTime.getTime();
  if (pickupDateTime.getTime() <= Date.now()) {
    throw new BookingInputError("Pick-up must be in the future.");
  }
  if (durationMs <= 0) {
    throw new BookingInputError("Return date and time must be later than pick-up.");
  }
  if (durationMs > 90 * DAY_MS) {
    throw new BookingInputError("Bookings are limited to 90 days.");
  }
  if (input.rentalType !== "self-drive" && input.rentalType !== "chauffeur") {
    throw new BookingInputError("Choose a supported rental type.");
  }
  if (typeof input.roundTrip !== "boolean") {
    throw new BookingInputError("Choose whether this is a round trip.");
  }

  const vehicle =
    fleet === null
      ? null
      : fleet.find((entry) => entry.id === vehicleId || entry.slug === vehicleId);
  if (fleet !== null && !vehicle) {
    throw new BookingInputError("Choose a valid fleet vehicle.");
  }
  if (vehicle && !vehicle.available) {
    throw new BookingInputError("This vehicle is currently unavailable.");
  }

  const rentalDurationDays = Math.ceil(durationMs / DAY_MS);
  if (!vehicle) {
    return {
      idempotencyKey,
      customerName,
      customerPhone: phone,
      customerEmail: email,
      vehicleId,
      pickupLocation,
      returnLocation,
      pickupDateTime,
      returnDateTime,
      rentalDurationDays,
      rentalType: input.rentalType,
      roundTrip: input.roundTrip,
      additionalRequests,
      pickupPreference,
      documents,
    };
  }

  const estimatedTotal = vehicle.pricePerDay * rentalDurationDays;
  if (!Number.isSafeInteger(estimatedTotal) || estimatedTotal <= 0) {
    throw new BookingInputError("Unable to calculate this booking estimate.");
  }

  return {
    idempotencyKey,
    customerName,
    customerPhone: phone,
    customerEmail: email,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    vehicleDetails: {
      id: vehicle.id,
      name: vehicle.name,
      model: vehicle.model || "",
      image: vehicle.image || "",
      registrationNumber: vehicle.registrationNumber || "",
    },
    pickupLocation,
    returnLocation,
    pickupDateTime,
    returnDateTime,
    rentalDurationDays,
    startingDailyRate: vehicle.pricePerDay,
    estimatedTotal,
    rentalType: input.rentalType,
    roundTrip: input.roundTrip,
    additionalRequests,
    pickupPreference,
    documents,
    baseTariff: estimatedTotal,
    pickupCharges: 0,
    dropCharges: 0,
    securityDeposit: 0,
    totalAmount: estimatedTotal,
    advanceAmount: ADVANCE_AMOUNT,
    remainingAmount: Math.max(estimatedTotal - ADVANCE_AMOUNT, 0),
    paymentStatus: "pending",
  };
}

function publicBooking(booking) {
  return {
    bookingReference: booking.bookingReference,
    bookingId: booking.bookingId ?? booking.bookingReference,
    vehicleId: booking.vehicleId,
    vehicleName: booking.vehicleName,
    vehicleDetails: booking.vehicleDetails,
    pickupLocation: booking.pickupLocation,
    returnLocation: booking.returnLocation,
    pickupDateTime: booking.pickupDateTime.toISOString(),
    returnDateTime: booking.returnDateTime.toISOString(),
    rentalDurationDays: booking.rentalDurationDays,
    startingDailyRate: booking.startingDailyRate,
    estimatedTotal: booking.estimatedTotal,
    totalAmount: booking.totalAmount ?? booking.estimatedTotal,
    baseTariff: booking.baseTariff ?? booking.estimatedTotal,
    pickupCharges: booking.pickupCharges ?? 0,
    dropCharges: booking.dropCharges ?? 0,
    securityDeposit: booking.securityDeposit ?? 0,
    advanceAmount: booking.advanceAmount ?? ADVANCE_AMOUNT,
    remainingAmount: booking.remainingAmount ?? Math.max((booking.totalAmount ?? booking.estimatedTotal) - ADVANCE_AMOUNT, 0),
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    pickupPreference: booking.pickupPreference,
    documents: booking.documents,
    additionalRequests: booking.additionalRequests,
    paymentStatus: booking.paymentStatus,
    whatsappStatus: booking.whatsappStatus,
    whatsappMessageId: booking.whatsappMessageId,
    rentalType: booking.rentalType,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  };
}

function authorizeBooking(booking, token) {
  if (!booking || typeof token !== "string" || !token) return false;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const storedHash = booking.accessTokenHash;
  return typeof storedHash === "string" &&
    storedHash.length === tokenHash.length &&
    timingSafeEqual(Buffer.from(storedHash), Buffer.from(tokenHash));
}

async function recordVerifiedPayment(booking, payment, gatewayPaymentId, signature) {
  payment.paymentStatus = "verified";
  payment.paymentId = gatewayPaymentId;
  payment.gatewayTransactionId = gatewayPaymentId;
  payment.gatewaySignature = signature;
  payment.paymentDate = new Date();
  await payment.save();

  const paidPayments = await Payment.find({
    bookingReference: booking.bookingReference,
    paymentStatus: "verified",
  }).lean();
  const paidAmount = paidPayments.reduce((sum, entry) => sum + entry.amount, 0);
  booking.paymentStatus = paidAmount >= booking.totalAmount ? "paid" : "partial";
  booking.remainingAmount = Math.max(booking.totalAmount - paidAmount, 0);
  booking.status = "confirmed";

  try {
    if (booking.whatsappStatus !== "sent") {
      const result = await sendWhatsAppConfirmation(booking, payment);
      booking.whatsappStatus = result.status;
      booking.whatsappMessageId = result.messageId || "";
      booking.whatsappError = result.error || "";
      payment.whatsappStatus = result.status;
      payment.whatsappMessageId = result.messageId || "";
      payment.whatsappError = result.error || "";
      await payment.save();
    }
  } catch (error) {
    booking.whatsappStatus = "failed";
    booking.whatsappError = error instanceof Error ? error.message : "WhatsApp delivery failed.";
    payment.whatsappStatus = "failed";
    payment.whatsappError = booking.whatsappError;
    await payment.save();
  }

  await booking.save();
  return publicBooking(booking);
}

function newBookingReference() {
  return `EPD-${Date.now().toString(36).toUpperCase()}-${randomBytes(10)
    .toString("hex")
    .toUpperCase()}`;
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

async function createBooking(req, res, next) {
  try {
    validateBookingInput(req.body, req.get("Idempotency-Key"), null);
    if (!isDatabaseReady()) {
      return res.status(503).json({
        code: "database_unavailable",
        error: "Booking confirmation is temporarily unavailable.",
      });
    }

    await ensureFleetSeededIfNeeded();
    const fleet = await FleetVehicle.find({ archived: { $ne: true } }).lean();
    const bookingData = validateBookingInput(
      req.body,
      req.get("Idempotency-Key"),
      fleet,
    );

    await Booking.init();
    const existing = await Booking.findOne({
      idempotencyKey: bookingData.idempotencyKey,
    });
    if (existing) {
      return res.status(200).json({ booking: publicBooking(existing) });
    }

    const accessToken = randomBytes(32).toString("base64url");
    const accessTokenHash = createHash("sha256")
      .update(accessToken)
      .digest("hex");
    const bookingReference = newBookingReference();
    const booking = await Booking.create({
      ...bookingData,
      bookingReference,
      bookingId: bookingReference,
      accessTokenHash,
      status: "pending",
    });

    return res.status(201).json({
      booking: publicBooking(booking),
      accessToken,
    });
  } catch (error) {
    if (error?.code === 11000) {
      try {
        const existing = await Booking.findOne({
          idempotencyKey: req.get("Idempotency-Key"),
        });
        if (existing) {
          return res.status(200).json({ booking: publicBooking(existing) });
        }
      } catch (lookupError) {
        return next(lookupError);
      }
    }
    return next(error);
  }
}

async function createPaymentOrder(req, res, next) {
  try {
    if (!isDatabaseReady()) return res.status(503).json({ code: "database_unavailable", error: "Payment database is unavailable." });
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) return res.status(503).json({ code: "payment_not_configured", error: "Payment gateway is not configured." });

    const bookingReference = readText(req.body?.bookingReference, "Booking reference", 80);
    const accessToken = readText(req.body?.accessToken, "Booking access token", 200);
    const paymentType = req.body?.paymentType === "full" ? "full" : "advance";
    const booking = await Booking.findOne({ bookingReference }).select("+accessTokenHash");
    if (!authorizeBooking(booking, accessToken)) return res.status(404).json({ error: "Booking not found." });
    const verifiedPayments = await Payment.find({ bookingReference, paymentStatus: "verified" }).lean();
    const paidAmount = verifiedPayments.reduce((sum, entry) => sum + entry.amount, 0);
    const amount = paymentType === "full"
      ? Math.max(booking.totalAmount - paidAmount, 0)
      : booking.advanceAmount;
    if (!Number.isSafeInteger(amount) || amount <= 0) return res.status(409).json({ error: "This booking has no remaining payment due." });
    const existing = await Payment.findOne({ bookingReference, amount, paymentStatus: "created" });
    if (existing) return res.json({ keyId, orderId: existing.gatewayOrderId, amount, currency: "INR", booking: publicBooking(booking) });

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const gatewayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount * 100, currency: "INR", receipt: bookingReference, notes: { bookingReference, paymentType } }),
    });
    const order = await gatewayResponse.json().catch(() => null);
    if (!gatewayResponse.ok || !order?.id) return res.status(502).json({ error: "Payment order could not be created." });
    await Payment.create({
      bookingReference,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      amount,
      currency: "INR",
      gatewayOrderId: order.id,
      paymentStatus: "created",
    });
    return res.status(201).json({ keyId, orderId: order.id, amount, currency: "INR", booking: publicBooking(booking) });
  } catch (error) {
    return next(error);
  }
}

async function verifyPayment(req, res, next) {
  try {
    if (!isDatabaseReady()) return res.status(503).json({ code: "database_unavailable", error: "Payment database is unavailable." });
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keySecret) return res.status(503).json({ code: "payment_not_configured", error: "Payment gateway is not configured." });
    const bookingReference = readText(req.body?.bookingReference, "Booking reference", 80);
    const accessToken = readText(req.body?.accessToken, "Booking access token", 200);
    const orderId = readText(req.body?.razorpay_order_id, "Payment order", 100);
    const paymentId = readText(req.body?.razorpay_payment_id, "Payment", 100);
    const signature = readText(req.body?.razorpay_signature, "Payment signature", 200);
    const booking = await Booking.findOne({ bookingReference }).select("+accessTokenHash");
    if (!authorizeBooking(booking, accessToken)) return res.status(404).json({ error: "Booking not found." });
    const payment = await Payment.findOne({ bookingReference, gatewayOrderId: orderId }).select("+gatewaySignature");
    if (!payment) return res.status(404).json({ error: "Payment order not found." });
    if (payment.paymentStatus === "verified") {
      const confirmed = booking.whatsappStatus === "sent"
        ? publicBooking(booking)
        : await recordVerifiedPayment(booking, payment, payment.paymentId, payment.gatewaySignature);
      return res.json({ booking: confirmed, payment });
    }
    const signed = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    if (signed !== signature) return res.status(400).json({ error: "Payment verification failed." });

    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${keySecret}`).toString("base64");
    const gatewayResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Basic ${auth}` } });
    const gatewayPayment = await gatewayResponse.json().catch(() => null);
    if (
      !gatewayResponse.ok ||
      gatewayPayment?.order_id !== orderId ||
      gatewayPayment?.amount !== payment.amount * 100 ||
      !["captured", "authorized"].includes(gatewayPayment?.status)
    ) return res.status(400).json({ error: "Payment has not been captured by the gateway." });

    const confirmed = await recordVerifiedPayment(booking, payment, paymentId, signature);
    return res.json({ booking: confirmed, payment: { paymentId, amount: payment.amount, status: "verified" } });
  } catch (error) {
    return next(error);
  }
}

async function getBookingByReference(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({
        code: "database_unavailable",
        error: "Booking lookup is temporarily unavailable.",
      });
    }

    const token = req.get("Authorization")?.match(/^Bearer ([A-Za-z0-9_-]+)$/)?.[1];
    if (!token) {
      return res.status(401).json({ error: "Booking access token required." });
    }
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const booking = await Booking.findOne({
      bookingReference: req.params.reference,
    }).select("+accessTokenHash");
    const storedHash = booking?.accessTokenHash;
    const tokenMatches =
      typeof storedHash === "string" &&
      storedHash.length === tokenHash.length &&
      timingSafeEqual(Buffer.from(storedHash), Buffer.from(tokenHash));
    if (!booking || !tokenMatches) {
      return res.status(404).json({ error: "Booking not found." });
    }

    return res.status(200).json({ booking: publicBooking(booking) });
  } catch (error) {
    return next(error);
  }
}

export {
  BookingInputError,
  createBooking,
  createPaymentOrder,
  getBookingByReference,
  isDatabaseReady,
  publicBooking,
  validateBookingInput,
  verifyPayment,
};
