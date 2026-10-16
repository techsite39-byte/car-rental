import { Router } from "express";
import {
  createFleetVehicle,
  deleteFleetVehicle,
  getFleetVehicle,
  listFleet,
  updateFleetVehicle,
} from "../controllers/fleetController.js";
import { requireAdminApiToken } from "../middleware/requireAdminApiToken.js";

const router = Router();

router.get("/", listFleet);
router.get("/:identifier", getFleetVehicle);
router.post("/", requireAdminApiToken, createFleetVehicle);
router.patch("/:identifier", requireAdminApiToken, updateFleetVehicle);
router.delete("/:identifier", requireAdminApiToken, deleteFleetVehicle);

export default router;