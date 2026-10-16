import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

let server;
let origin;

before(async () => {
  process.env.FRONTEND_URL = "http://localhost:3000";
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("health reports disconnected database without leaking configuration", async () => {
  const response = await fetch(`${origin}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.deepEqual(body, { status: "degraded", databaseConnected: false });
  assert.equal(JSON.stringify(body).includes("MONGODB_URI"), false);
});

test("booking validation failures return a client error before database access", async () => {
  const response = await fetch(`${origin}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "bad-key",
    },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 422);
  assert.match((await response.json()).error, /submit your booking again/i);
});

test("valid booking requests are not accepted when the database is unavailable", async () => {
  const pickup = new Date(Date.now() + 86_400_000);
  const returning = new Date(pickup.getTime() + 86_400_000);
  const response = await fetch(`${origin}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "a7ce4f2d-5483-44b6-81a9-3e5ac91e8fd2",
    },
    body: JSON.stringify({
      customerName: "Alex Example",
      phone: "+91 98765 43210",
      email: "alex@example.com",
      vehicleId: "kia-clavis",
      pickupLocation: "Madurai",
      returnLocation: "Madurai",
      pickupDateTime: pickup.toISOString(),
      returnDateTime: returning.toISOString(),
      rentalType: "self-drive",
      roundTrip: true,
      estimatedTotal: 1,
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.code, "database_unavailable");
  assert.equal(body.booking, undefined);
});

test("CORS rejects an origin not configured for the frontend", async () => {
  const response = await fetch(`${origin}/api/health`, {
    headers: { Origin: "https://unexpected.example" },
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: "This origin is not allowed.",
  });
});
