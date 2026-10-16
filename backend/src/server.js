import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDirectory, "../.env.local") });

import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT || 5000);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

const app = createApp();
const server = app.listen(port, () => {
  console.info(`EPICDRIVE booking API listening on port ${port}.`);
  connectDatabase()
    .then(() => console.info("Booking database connection established."))
    .catch((error) => {
      console.error(
        "Booking database is unavailable; booking writes are disabled.",
        process.env.MONGODB_URI?.trim()
          ? error?.name || "DatabaseConnectionError"
          : "MONGODB_URI is not configured.",
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
