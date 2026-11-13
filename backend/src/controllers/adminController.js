import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import Booking from "../models/Booking.js";

const dummyAdminPasswordHash = bcrypt.hash(
  randomBytes(32).toString("hex"),
  12,
);

function authorizedAdminRequest(req) {
  const configuredToken = process.env.ADMIN_API_TOKEN?.trim();
  return Boolean(configuredToken && req.get("x-admin-api-token") === configuredToken);
}

async function loginAdmin(req, res) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Admin database is unavailable." });
  }

  const admin = await Admin.findOne({ email }).select("+password name email role isActive googleId");
  const passwordMatches = await bcrypt.compare(
    password,
    admin?.password ?? (await dummyAdminPasswordHash),
  );
  const valid =
    Boolean(admin && admin.isActive && admin.role === "admin") &&
    passwordMatches;
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password. Please try again." });
  }

  return res.json({
    authenticated: true,
    admin: {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      googleId: admin.googleId || null,
    },
  });
}

async function listBookings(req, res) {
  if (!authorizedAdminRequest(req)) return res.status(401).json({ error: "Admin authorization required." });
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Admin database is unavailable." });
  const bookings = await Booking.find({}).sort({ createdAt: -1 }).lean();
  return res.json({ bookings });
}

export { listBookings, loginAdmin };
