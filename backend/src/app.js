import cors from "cors";
import express from "express";
import helmet from "helmet";
import { isDatabaseReady } from "./controllers/bookingController.js";
import { errorHandler } from "./middleware/errorHandler.js";
import bookingRoutes from "./routes/bookingRoutes.js";

function configuredFrontendOrigin() {
  const value = process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
  return new URL(value).origin;
}

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origin === configuredFrontendOrigin()) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS."));
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key"],
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
  app.use((_req, res) => res.status(404).json({ error: "Endpoint not found." }));
  app.use(errorHandler);

  return app;
}

export { createApp };
