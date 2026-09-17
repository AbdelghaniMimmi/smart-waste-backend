import { Request, Response } from "express";
import { WasteBinModel } from "../models/WasteBin";
import { SettingsModel } from "../models/Settings";

console.log("binController loaded");

export async function getAllBinsStatus(req: Request, res: Response) {
  try {
    const bins = await WasteBinModel.find().sort({ binId: 1 });
    return res.json(bins);
  } catch (error) {
    console.error("Error in getAllBinsStatus:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

function isValidCoordinate(value: any, max: number): boolean {
  return (
    typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= max
  );
}

export async function createBin(req: Request, res: Response) {
  try {
    const { binId, latitude, longitude } = req.body;

    if (typeof binId !== "string" || !binId.trim()) {
      return res.status(400).json({ message: "رقم الحاوية مطلوب" });
    }

    if (!isValidCoordinate(latitude, 90)) {
      return res.status(400).json({ message: "خط العرض غير صالح" });
    }

    if (!isValidCoordinate(longitude, 180)) {
      return res.status(400).json({ message: "خط الطول غير صالح" });
    }

    const trimmedId = binId.trim();

    const existing = await WasteBinModel.findOne({ binId: trimmedId });
    if (existing) {
      return res.status(409).json({ message: "رقم الحاوية مستعمل من قبل" });
    }

    // تُنشأ الحاوية بلا قراءات، وتُملأ لاحقًا من المستشعر
    const bin = await WasteBinModel.create({
      binId: trimmedId,
      latitude,
      longitude,
      lastFillLevel: null,
      lastWeight: null,
      lastUpdate: null
    });

    return res.status(201).json({ message: "تم إنشاء الحاوية", bin });
  } catch (error) {
    console.error("Error in createBin:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getCriticalBins(req: Request, res: Response) {
  try {
    let threshold: number;

    if (req.query.threshold) {
      threshold = Number(req.query.threshold);
    } else {
      const settings = await SettingsModel.findOne();
      threshold = settings?.defaultThreshold ?? 80;
    }

    const bins = await WasteBinModel.find({
      lastFillLevel: { $ne: null, $gte: threshold }
    });

    return res.json({ threshold, bins });
  } catch (error) {
    console.error("Error in getCriticalBins:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}