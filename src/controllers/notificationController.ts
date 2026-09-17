import { Response } from "express";
import { NotificationModel } from "../models/Notification";
import { AuthRequest } from "../middleware/authMiddleware";

const MAX_NOTIFICATIONS = 50;

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const notifications = await NotificationModel.find()
      .sort({ createdAt: -1 })
      .limit(MAX_NOTIFICATIONS)
      .lean();

    const items = notifications.map((n) => ({
      _id: n._id,
      type: n.type,
      binId: n.binId,
      fillLevel: n.fillLevel,
      message: n.message,
      severity: n.severity,
      createdAt: n.createdAt,
      read: (n.readBy || []).includes(userId),
    }));

    return res.json({
      notifications: items,
      unreadCount: items.filter((item) => !item.read).length,
    });
  } catch (err) {
    console.error("Error in getNotifications:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const updated = await NotificationModel.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: userId } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error in markAsRead:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const result = await NotificationModel.updateMany(
      { readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    return res.json({
      message: "All notifications marked as read",
      updated: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error in markAllAsRead:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
