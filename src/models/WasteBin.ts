import mongoose, { Document, Schema } from "mongoose";

export interface WasteBin extends Document {
  binId: string;
  latitude: number | null;
  longitude: number | null;
  lastFillLevel: number | null;
  lastWeight: number | null;
  lastUpdate: string | null;
  status: string;
}

const WasteBinSchema = new Schema<WasteBin>({
  binId: { type: String, required: true, unique: true },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  lastFillLevel: { type: Number, default: null },
  lastWeight: { type: Number, default: null },
  lastUpdate: { type: String, default: null },
  status: { type: String, default: "OK" },
});

export const WasteBinModel = mongoose.model<WasteBin>(
  "WasteBin",
  WasteBinSchema
);