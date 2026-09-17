import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// الإشعارات متاحة لكل المستخدمين الموثّقين (admin / agent / driver)
router.get("/notifications", requireAuth, getNotifications);
router.put("/notifications/read-all", requireAuth, markAllAsRead);
router.put("/notifications/:id/read", requireAuth, markAsRead);

export default router;
