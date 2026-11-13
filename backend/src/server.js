import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDirectory, "../.env") });

import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { adminSeedConfig, seedInitialAdmin } from "./services/adminSeeder.js";

const configuredPort =
  process.env.PORT?.trim() ||
  (process.env.NODE_ENV === "production" ? "" : "5000");
if (!configuredPort) {
  throw new Error("PORT must be configured in production.");
}
const port = Number(configuredPort);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

function safeStartupErrorMessage(error) {
  if (typeof error?.message !== "string") return undefined;
  return error.message
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, "[MongoDB URI redacted]")
    .slice(0, 500);
}

if (process.env.NODE_ENV === "production") {
  const requiredVariables = [
    "MONGODB_URI",
    "FRONTEND_URL",
    "ADMIN_EMAIL",
    "ADMIN_INITIAL_PASSWORD",
    "ADMIN_API_TOKEN",
    "ADMIN_SESSION_SECRET",
  ];
  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missingVariables.join(", ")}.`,
    );
  }
  if (process.env.ADMIN_SESSION_SECRET.trim().length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
}
adminSeedConfig();

const app = createApp();
const server = app.listen(port, "0.0.0.0", () => {
  console.info(`EPICDRIVE booking API listening on port ${port}.`);
  connectDatabase()
    .then(async () => {
      console.info("Booking database connection established.");
      const result = await seedInitialAdmin();
      console.info(
        result.created
          ? `Initial admin account created for ${result.email}.`
          : `Initial admin account already exists for ${result.email}.`,
      );
    })
    .catch((error) => {
      const message = safeStartupErrorMessage(error);
      console.error(
        "Backend startup dependency initialization failed; database-backed requests may be unavailable.",
        {
          error: error?.name || "UnknownError",
          ...(message ? { message } : {}),
          ...(typeof error?.code === "string" || typeof error?.code === "number"
            ? { code: error.code }
            : {}),
        },
      );
    });
});

server.on("error", (error) => {
  console.error("Booking API server failed to start.", error.name);
  process.exitCode = 1;
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`Received ${signal}; shutting down booking API.`);
  server.close(async (error) => {
    if (error) {
      console.error("Booking API shutdown failed.", error.name);
      process.exitCode = 1;
    }
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error(
        "Database shutdown failed.",
        disconnectError?.name || "DatabaseDisconnectError",
      );
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
