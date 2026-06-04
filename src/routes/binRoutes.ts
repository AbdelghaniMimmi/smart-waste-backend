import { Router } from "express";
import { getAllBinsStatus, getCriticalBins } from "../controllers/binController";
import { getOptimizedRoutes } from "../controllers/routeController";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

// كل هذه الراوتات تتطلب توثيق
router.get("/bins/status", requireAuth, requireRole(["admin", "agent"]), getAllBinsStatus);

// مثلاً هذه فقط للـ admin و agent
router.get("/bins/critical", requireAuth, requireRole(["admin", "agent"]), getCriticalBins);

// route تحسين المسار للـ admin والسائقين
router.get("/bins/route", requireAuth, requireRole(["admin", "agent", "driver"]), getOptimizedRoutes);

export default router;