import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";
import FleetVehicle from "../src/models/FleetVehicle.js";

const shouldRun = Boolean(process.env.MONGODB_URI?.trim());
const adminToken = `integration-${randomUUID()}`;
const slug = `integration-test-${randomUUID()}`;
let connection;
let server;

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (connection) {
    await FleetVehicle.deleteOne({ slug }).catch(() => undefined);
    await connection.close();
  }
});

test(
  "Mongo fleet API creates, updates, reads, and archives a vehicle",
  { skip: !shouldRun },
  async () => {
    process.env.ADMIN_API_TOKEN = adminToken;
    process.env.FRONTEND_URL = "http://localhost:3000";
    connection = await connectDatabase();
    server = createApp().listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));

    const origin = `http://127.0.0.1:${server.address().port}`;
    const headers = {
      "Content-Type": "application/json",
      "X-Admin-API-Key": adminToken,
    };
    const vehicle = {
      brand: "Integration",
      model: "Test",
      name: "Integration Test Vehicle",
      slug,
      category: "sedan",
      type: "Sedan",
      pricePerDay: 1234,
      seats: 4,
      transmission: "Manual",
      fuelType: "Petrol",
      description: "Temporary integration record.",
      image: "",
      available: true,
      featured: false,
    };
    const createdResponse = await fetch(`${origin}/api/fleet`, {
      method: "POST",
      headers,
      body: JSON.stringify(vehicle),
    });
    assert.equal(createdResponse.status, 201);
    const created = (await createdResponse.json()).vehicle;

    const updatedResponse = await fetch(`${origin}/api/fleet/${created.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        ...vehicle,
        name: "Integration Test Updated",
        pricePerDay: 2345,
      }),
    });
    assert.equal(updatedResponse.status, 200);
    const updated = (await updatedResponse.json()).vehicle;
    assert.equal(updated.name, "Integration Test Updated");
    assert.equal(updated.pricePerDay, 2345);

    const deletedResponse = await fetch(`${origin}/api/fleet/${created.id}`, {
      method: "DELETE",
      headers,
    });
    assert.equal(deletedResponse.status, 200);
    const missingResponse = await fetch(`${origin}/api/fleet/${created.id}`);
    assert.equal(missingResponse.status, 404);
  },
);