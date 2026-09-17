import mongoose, { Document, Schema } from "mongoose";

export type NotificationSeverity = "critical" | "warning" | "info";

export interface Notification extends Document {
  type: string;
  binId: string;
  fillLevel: number;
  message: string;
  severity: NotificationSeverity;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<Notification>(
  {
    type: { type: String, required: true },
    binId: { type: String, required: true },
    fillLevel: { type: Number, required: true },
    message: { type: String, required: true },
    severity: { type: String, default: "info" },
    // معرّفات المستخدمين الذين قرأوا الإشعار
    readBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: -1 });

export const NotificationModel = mongoose.model<Notification>(
  "Notification",
  NotificationSchema
);
