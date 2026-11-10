import { Router } from "express";
import { listBookings, loginAdmin } from "../controllers/adminController.js";

const adminRoutes = Router();
adminRoutes.post("/login", loginAdmin);
adminRoutes.get("/bookings", listBookings);

export default adminRoutes;
