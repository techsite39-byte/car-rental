import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import vehicles from "../../../data/vehicles.json" with { type: "json" };
import originalVehicles from "../../../data/original-vehicles.json" with { type: "json" };
import Booking from "../models/Booking.js";
import FleetVehicle from "../models/FleetVehicle.js";
import { ensureFleetSeeded } from "./fleetController.js";

const DAY_MS = 86_400_000;
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
  };
}

function publicBooking(booking) {
  return {
    bookingReference: booking.bookingReference,
    vehicleId: booking.vehicleId,
    vehicleName: booking.vehicleName,
    pickupLocation: booking.pickupLocation,
    returnLocation: booking.returnLocation,
    pickupDateTime: booking.pickupDateTime.toISOString(),
    returnDateTime: booking.returnDateTime.toISOString(),
    rentalDurationDays: booking.rentalDurationDays,
    startingDailyRate: booking.startingDailyRate,
    estimatedTotal: booking.estimatedTotal,
    rentalType: booking.rentalType,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  };
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

    await ensureFleetSeeded();
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
    const booking = await Booking.create({
      ...bookingData,
      bookingReference: newBookingReference(),
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
  getBookingByReference,
  isDatabaseReady,
  publicBooking,
  validateBookingInput,
};
