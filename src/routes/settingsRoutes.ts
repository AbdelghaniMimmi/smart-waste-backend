import { Router } from "express";
import { getSettings, updateThreshold } from "../controllers/settingsController";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.get("/settings", requireAuth, requireRole(["admin", "agent"]), getSettings);
router.put("/settings/threshold", requireAuth, requireRole(["admin", "agent"]), updateThreshold);

export default router;