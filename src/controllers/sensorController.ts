import { Request, Response } from "express";
import { SensorReadingModel } from "../models/sensorReading";
import { WasteBinModel } from "../models/WasteBin";

export async function createSensorReading(req: Request, res: Response) {
  try {
    const body = req.body as any;

    if (!body.binId || body.fillLevel === undefined) {
      return res
        .status(400)
        .json({ message: "binId et fillLevel sont obligatoires" });
    }

    const timestamp = body.timestamp ?? new Date().toISOString();

    // 1) حفظ القراءة في SensorReading
    const dataEntry = await SensorReadingModel.create({
      binId: body.binId,
      fillLevel: body.fillLevel,
      weight: body.weight ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      battery: body.battery ?? null,
      timestamp,
    });

    // 2) تحديث سجل الحاوية (إن وُجد) أو إنشاؤه إن لم يوجد
    await WasteBinModel.findOneAndUpdate(
      { binId: body.binId },
      {
        binId: body.binId,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        lastFillLevel: body.fillLevel,
        lastWeight: body.weight ?? null,
        lastUpdate: timestamp
      },
      { upsert: true, new: true }
    );

    console.log("New sensor data saved:", dataEntry);

    return res.status(201).json({ message: "Données enregistrées", data: dataEntry });
  } catch (error) {
    console.error("Error in createSensorReading:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getSensorReadings(req: Request, res: Response) {
  try {
    const readings = await SensorReadingModel
      .find()
      .sort({ timestamp: -1 })
      .limit(100);
    return res.json(readings);
  } catch (error) {
    console.error("Error in getSensorReadings:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}