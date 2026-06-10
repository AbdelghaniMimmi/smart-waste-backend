import { Router } from "express";
import { registerUser, getAllUsers, deleteUser } from "../controllers/userController";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

// إنشاء مستخدم جديد بواسطة الـ admin
router.post(
  "/users",
  requireAuth,
  requireRole(["admin"]),
  registerUser
);

// جلب كل المستخدمين
router.get(
  "/users",
  requireAuth,
  requireRole(["admin"]),
  getAllUsers
);

// حذف مستخدم
router.delete(
  "/users/:id",
  requireAuth,
  requireRole(["admin"]),
  deleteUser
);

export default router;