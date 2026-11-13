import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { adminSeedConfig } from "../src/services/adminSeeder.js";

function setEnvironment(values) {
  const previous = new Map();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

test("admin bootstrap requires explicit email and password", () => {
  const restore = setEnvironment({
    ADMIN_EMAIL: undefined,
    ADMIN_INITIAL_PASSWORD: undefined,
    ADMIN_PASSWORD: undefined,
  });
  try {
    assert.throws(adminSeedConfig, /ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD/);
  } finally {
    restore();
  }
});

test("admin bootstrap uses only explicitly configured credentials", () => {
  const restore = setEnvironment({
    ADMIN_EMAIL: "  fleet@example.test ",
    ADMIN_INITIAL_PASSWORD: "configured-test-password",
    ADMIN_INITIAL_NAME: "Fleet Admin",
    ADMIN_PASSWORD: undefined,
  });
  try {
    assert.deepEqual(adminSeedConfig(), {
      email: "fleet@example.test",
      password: "configured-test-password",
      name: "Fleet Admin",
    });
  } finally {
    restore();
  }
});

test("production CORS requires a configured frontend origin", () => {
  const restore = setEnvironment({
    NODE_ENV: "production",
    FRONTEND_URL: undefined,
  });
  try {
    assert.throws(createApp, /FRONTEND_URL must be configured/);
  } finally {
    restore();
  }
});

test("admin login exposes required preflight methods and headers", async () => {
  const restore = setEnvironment({
    NODE_ENV: "production",
    FRONTEND_URL: "https://cars.example.test",
  });
  const server = createApp().listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/login`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://cars.example.test",
        "Access-Control-Request-Method": "PATCH",
        "Access-Control-Request-Headers": "authorization,x-admin-api-key,x-admin-api-token",
      },
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://cars.example.test");
    assert.match(response.headers.get("access-control-allow-methods") ?? "", /PATCH/);
    assert.match(response.headers.get("access-control-allow-methods") ?? "", /DELETE/);
    assert.match(response.headers.get("access-control-allow-headers") ?? "", /x-admin-api-key/i);
    assert.match(response.headers.get("access-control-allow-headers") ?? "", /x-admin-api-token/i);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    restore();
  }
});

test("admin login returns 429 after the configured attempt limit", async () => {
  const restore = setEnvironment({
    NODE_ENV: "test",
    FRONTEND_URL: "http://localhost:3000",
  });
  const server = createApp().listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/admin/login`;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(response.status, 400);
    }
    const limited = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(limited.status, 429);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    restore();
  }
});
