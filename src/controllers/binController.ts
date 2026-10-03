import { Request, Response } from "express";
import mongoose from "mongoose";
import { WasteBinModel } from "../models/WasteBin";
import { SettingsModel } from "../models/Settings";
import { NotificationModel } from "../models/Notification";
import { SensorReadingModel } from "../models/sensorReading";
import { notifyOnFillChange } from "../services/notificationService";

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

function isEmpty(value: any): boolean {
  return value === undefined || value === null || value === "";
}

type ParsedReading =
  | { ok: true; fillLevel?: number; weight?: number }
  | { ok: false; message: string };

/**
 * يتحقق من القراءة اليدوية (مستوى الامتلاء والوزن)؛ الحقلان اختياريان،
 * ويبقى الحقل غير المُرسل كما هو.
 */
function parseManualReading(body: any): ParsedReading {
  const result: { ok: true; fillLevel?: number; weight?: number } = { ok: true };

  if (!isEmpty(body.fillLevel)) {
    const fill = body.fillLevel;
    if (typeof fill !== "number" || !Number.isFinite(fill) || fill < 0 || fill > 100) {
      return { ok: false, message: "مستوى الامتلاء يجب أن يكون بين 0 و 100" };
    }
    result.fillLevel = fill;
  }

  if (!isEmpty(body.weight)) {
    const weight = body.weight;
    if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0) {
      return { ok: false, message: "الوزن يجب أن يكون رقمًا موجبًا" };
    }
    result.weight = weight;
  }

  return result;
}

/**
 * يحفظ القراءة اليدوية في سجل القراءات حتى تظهر مع قراءات المستشعر،
 * ثم ينشئ إشعارًا إن عبرت الحاوية الحد الحرج.
 */
async function recordManualReading(
  bin: { binId: string; latitude: number | null; longitude: number | null },
  previousFill: number | null,
  fillLevel: number | undefined,
  weight: number | null,
  timestamp: string
) {
  if (fillLevel === undefined) return;

  await SensorReadingModel.create({
    binId: bin.binId,
    fillLevel,
    weight,
    latitude: bin.latitude,
    longitude: bin.longitude,
    status: "MANUAL",
    timestamp,
  });

  await notifyOnFillChange(bin.binId, previousFill, fillLevel);
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

    const reading = parseManualReading(req.body);
    if (!reading.ok) {
      return res.status(400).json({ message: reading.message });
    }

    const trimmedId = binId.trim();

    const existing = await WasteBinModel.findOne({ binId: trimmedId });
    if (existing) {
      return res.status(409).json({ message: "رقم الحاوية مستعمل من قبل" });
    }

    // القراءات اختيارية: بدونها تُملأ الحاوية لاحقًا من المستشعر
    const hasReading =
      reading.fillLevel !== undefined || reading.weight !== undefined;
    const now = new Date().toISOString();

    const bin = await WasteBinModel.create({
      binId: trimmedId,
      latitude,
      longitude,
      lastFillLevel: reading.fillLevel ?? null,
      lastWeight: reading.weight ?? null,
      lastUpdate: hasReading ? now : null,
      source: hasReading ? "manual" : "sensor"
    });

    await recordManualReading(bin, null, reading.fillLevel, bin.lastWeight, now);

    return res.status(201).json({ message: "تم إنشاء الحاوية", bin });
  } catch (error) {
    console.error("Error in createBin:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function updateBin(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "معرّف الحاوية غير صالح" });
    }

    const { latitude, longitude } = req.body;

    if (latitude !== undefined && !isValidCoordinate(latitude, 90)) {
      return res.status(400).json({ message: "خط العرض غير صالح" });
    }

    if (longitude !== undefined && !isValidCoordinate(longitude, 180)) {
      return res.status(400).json({ message: "خط الطول غير صالح" });
    }

    const reading = parseManualReading(req.body);
    if (!reading.ok) {
      return res.status(400).json({ message: reading.message });
    }

    const bin = await WasteBinModel.findById(id);
    if (!bin) {
      return res.status(404).json({ message: "الحاوية غير موجودة" });
    }

    const previousFill = bin.lastFillLevel;
    const now = new Date().toISOString();

    if (latitude !== undefined) bin.latitude = latitude;
    if (longitude !== undefined) bin.longitude = longitude;

    if (reading.fillLevel !== undefined || reading.weight !== undefined) {
      if (reading.fillLevel !== undefined) bin.lastFillLevel = reading.fillLevel;
      if (reading.weight !== undefined) bin.lastWeight = reading.weight;
      bin.lastUpdate = now;
      bin.source = "manual";
    }

    await bin.save();

    await recordManualReading(bin, previousFill, reading.fillLevel, bin.lastWeight, now);

    return res.json({ message: "تم تحديث الحاوية", bin });
  } catch (error) {
    console.error("Error in updateBin:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function deleteBin(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "معرّف الحاوية غير صالح" });
    }

    const bin = await WasteBinModel.findByIdAndDelete(id);
    if (!bin) {
      return res.status(404).json({ message: "الحاوية غير موجودة" });
    }

    // حذف إشعارات الحاوية حتى لا تبقى إشعارات تشير إلى حاوية محذوفة
    await NotificationModel.deleteMany({ binId: bin.binId });

    return res.json({ message: "تم حذف الحاوية", bin });
  } catch (error) {
    console.error("Error in deleteBin:", error);
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