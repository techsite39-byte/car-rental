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

function listFleetRoute(req, res, next) {
  if (req.query.includeHidden === "true") {
    return requireAdminApiToken(req, res, () => listFleet(req, res, next));
  }
  return listFleet(req, res, next);
}

router.get("/", listFleetRoute);
router.get("/:identifier", getFleetVehicle);
router.post("/", requireAdminApiToken, createFleetVehicle);
router.patch("/:identifier", requireAdminApiToken, updateFleetVehicle);
router.delete("/:identifier", requireAdminApiToken, deleteFleetVehicle);

export default router;
