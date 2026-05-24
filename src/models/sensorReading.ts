import mongoose, { Document, Schema } from "mongoose";

export interface SensorReading extends Document {
  binId: string;
  fillLevel: number;
  weight: number | null;
  latitude: number | null;
  longitude: number | null;
  battery: number | null;
  timestamp: string;
}

const SensorReadingSchema = new Schema<SensorReading>({
  binId: { type: String, required: true },
  fillLevel: { type: Number, required: true },
  weight: { type: Number, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  battery: { type: Number, default: null },
  timestamp: { type: String, required: true },
});

export const SensorReadingModel = mongoose.model<SensorReading>(
  "SensorReading",
  SensorReadingSchema
);