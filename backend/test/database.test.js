import assert from "node:assert/strict";
import { test } from "node:test";
import {
  connectDatabase,
  databaseNameFromUri,
} from "../src/config/database.js";

test("uses epicdrive as the default database when the URI has no database path", () => {
  assert.equal(
    databaseNameFromUri("mongodb+srv://user:pass@cluster.example.mongodb.net/?retryWrites=true"),
    "epicdrive",
  );
});

test("preserves an explicitly selected database name", () => {
  assert.equal(
    databaseNameFromUri("mongodb://localhost:27017/rentals"),
    "rentals",
  );
});

test("rejects a missing MongoDB URI without attempting a connection", async () => {
  const previousUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  try {
    await assert.rejects(connectDatabase(), /MONGODB_URI is not configured/);
  } finally {
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }
});

test("rejects a malformed MongoDB protocol without exposing a connection string", async () => {
  const previousUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = "https://not-a-mongodb-uri.invalid";
  try {
    await assert.rejects(connectDatabase(), /mongodb or mongodb\+srv protocol/);
  } finally {
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }
});
