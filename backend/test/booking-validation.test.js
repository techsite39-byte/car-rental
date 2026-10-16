import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BookingInputError,
  validateBookingInput,
} from "../src/controllers/bookingController.js";

const idempotencyKey = "fbd3f320-a653-4b4e-b557-6cf05c26b2a7";

function validInput(overrides = {}) {
  const pickupDateTime = new Date(Date.now() + 2 * 86_400_000);
  const returnDateTime = new Date(pickupDateTime.getTime() + 2 * 86_400_000);
  return {
    customerName: "Alex Example",
    phone: "+91 98765 43210",
    email: "alex@example.com",
    vehicleId: "kia-clavis",
    pickupLocation: "Madurai",
    returnLocation: "Madurai",
    pickupDateTime: pickupDateTime.toISOString(),
    returnDateTime: returnDateTime.toISOString(),
    rentalType: "self-drive",
    roundTrip: true,
    additionalRequests: "",
    estimatedTotal: 1,
    startingDailyRate: 1,
    ...overrides,
  };
}

test("estimates use shared server-side vehicle pricing and duration", () => {
  const booking = validateBookingInput(validInput(), idempotencyKey);

  assert.equal(booking.vehicleName, "Kia Clavis");
  assert.equal(booking.startingDailyRate, 4000);
  assert.equal(booking.rentalDurationDays, 2);
  assert.equal(booking.estimatedTotal, 8000);
  assert.equal(booking.customerEmail, "alex@example.com");
});

test("restored showcase vehicles keep server-authoritative pricing", () => {
  const booking = validateBookingInput(
    validInput({ vehicleId: "atlas-x7", estimatedTotal: 0 }),
    idempotencyKey,
  );

  assert.equal(booking.vehicleName, "Atlas X7");
  assert.equal(booking.startingDailyRate, 420);
  assert.equal(booking.estimatedTotal, 840);
});

test("rejects return times before or equal to pick-up", () => {
  const pickup = new Date(Date.now() + 86_400_000);
  assert.throws(
    () =>
      validateBookingInput(
        validInput({
          pickupDateTime: pickup.toISOString(),
          returnDateTime: pickup.toISOString(),
        }),
        idempotencyKey,
      ),
    /later than pick-up/,
  );
});

test("rejects invalid email and unknown vehicles", () => {
  assert.throws(
    () => validateBookingInput(validInput({ email: "bad-address" }), idempotencyKey),
    /valid email address/,
  );
  assert.throws(
    () => validateBookingInput(validInput({ vehicleId: "not-in-fleet" }), idempotencyKey),
    /valid fleet vehicle/,
  );
});

test("malformed input produces a client validation error", () => {
  assert.throws(
    () => validateBookingInput({}, "bad-key"),
    (error) => error instanceof BookingInputError && error.statusCode === 422,
  );
});
