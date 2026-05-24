import mongoose, { Document, Schema } from "mongoose";

export interface WasteBin extends Document {
  binId: string;
  locationName?: string;        // اسم المكان (اختياري)
  latitude: number | null;
  longitude: number | null;
  lastFillLevel: number | null;
  lastWeight: number | null;
  lastUpdate: string | null;
}

const WasteBinSchema = new Schema<WasteBin>({
  binId: { type: String, required: true, unique: true },
  locationName: { type: String },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  lastFillLevel: { type: Number, default: null },
  lastWeight: { type: Number, default: null },
  lastUpdate: { type: String, default: null }
});

export const WasteBinModel = mongoose.model<WasteBin>(
  "WasteBin",
  WasteBinSchema
);