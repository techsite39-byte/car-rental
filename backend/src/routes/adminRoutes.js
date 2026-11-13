import { Router } from "express";
import rateLimit from "express-rate-limit";
import { listBookings, loginAdmin } from "../controllers/adminController.js";

const adminRoutes = Router();
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({
      error: "Too many login attempts. Please try again later.",
    });
  },
});

adminRoutes.post("/login", adminLoginLimiter, loginAdmin);
adminRoutes.get("/bookings", listBookings);

export default adminRoutes;
