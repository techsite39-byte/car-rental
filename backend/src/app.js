import cors from "cors";
import express from "express";
import helmet from "helmet";
import { isDatabaseReady } from "./controllers/bookingController.js";
import { errorHandler } from "./middleware/errorHandler.js";
import fleetRoutes from "./routes/fleetRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

function configuredFrontendOrigins() {
  const value = process.env.FRONTEND_URL?.trim();
  const origins = new Set();
  if (value) {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error("FRONTEND_URL must be an absolute HTTP(S) origin.");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      (process.env.NODE_ENV === "production" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error("FRONTEND_URL must be an absolute HTTP(S) origin.");
    }
    origins.add(url.origin);
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("FRONTEND_URL must be configured in production.");
  }

  if (process.env.NODE_ENV === "development") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }
  return origins;
}

function createApp() {
  const frontendOrigins = configuredFrontendOrigins();
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || frontendOrigins.has(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS."));
      },
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "X-Admin-API-Key",
        "X-Admin-API-Token",
      ],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "12kb", strict: true }));

  app.get("/api/health", (_req, res) => {
    const databaseConnected = isDatabaseReady();
    return res.status(databaseConnected ? 200 : 503).json({
      status: databaseConnected ? "ok" : "degraded",
      databaseConnected,
    });
  });
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/fleet", fleetRoutes);
  app.use("/api/admin", adminRoutes);
  app.use((_req, res) => res.status(404).json({ error: "Endpoint not found." }));
  app.use(errorHandler);

  return app;
}

export { createApp };
