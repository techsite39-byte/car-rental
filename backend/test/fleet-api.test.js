import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

let server;
let origin;
let previousToken;

before(async () => {
  previousToken = process.env.ADMIN_API_TOKEN;
  process.env.ADMIN_API_TOKEN = "test-only-admin-token";
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  if (previousToken === undefined) delete process.env.ADMIN_API_TOKEN;
  else process.env.ADMIN_API_TOKEN = previousToken;
});

test("fleet updates reject requests without the admin API token", async () => {
  const response = await fetch(`${origin}/api/fleet/kia-clavis`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Unauthorized change" }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: "Admin authorization required.",
  });
});

test("fleet reads stay public while MongoDB is unavailable", async () => {
  const response = await fetch(`${origin}/api/fleet`);

  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /temporarily unavailable/i);
});