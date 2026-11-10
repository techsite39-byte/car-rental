import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createBooking,
  createPaymentOrder,
  getBookingByReference,
  verifyPayment,
} from "../controllers/bookingController.js";

const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({
      error: "Too many booking attempts. Please try again later.",
    });
  },
});

const router = Router();
router.post("/", bookingLimiter, createBooking);
router.post("/payments/order", bookingLimiter, createPaymentOrder);
router.post("/payments/verify", bookingLimiter, verifyPayment);
router.get("/:reference", getBookingByReference);

export default router;
