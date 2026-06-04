import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  defaultThreshold: number;
}

const SettingsSchema = new Schema<ISettings>({
  defaultThreshold: { type: Number, default: 80 }
});

export const SettingsModel = mongoose.model<ISettings>("Settings", SettingsSchema);