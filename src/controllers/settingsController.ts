import { Request, Response } from "express";
import { SettingsModel } from "../models/Settings";
import { AuthRequest } from "../middleware/authMiddleware";

export async function getSettings(req: Request, res: Response) {
  const settings = await SettingsModel.findOne();
  if (!settings) {
    const created = await SettingsModel.create({ defaultThreshold: 80 });
    return res.json(created);
  }
  return res.json(settings);
}

export async function updateThreshold(req: AuthRequest, res: Response) {
  try {
    const { defaultThreshold } = req.body;

    if (typeof defaultThreshold !== "number") {
      return res.status(400).json({ message: "defaultThreshold must be a number" });
    }

    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = new SettingsModel({ defaultThreshold });
    } else {
      settings.defaultThreshold = defaultThreshold;
    }
    await settings.save();

    return res.json({ message: "Threshold updated", settings });
  } catch (err) {
    console.error("Error in updateThreshold:", err);
    return res.status(500).json({ message: "Server error" });
  }
}