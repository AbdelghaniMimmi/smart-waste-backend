import { Request, Response } from "express";
import { WasteBinModel } from "../models/WasteBin";

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

export async function getCriticalBins(req: Request, res: Response) {
  try {
    const threshold = Number(req.query.threshold ?? 80);

    const bins = await WasteBinModel.find({
      lastFillLevel: { $ne: null, $gte: threshold }
    });

    return res.json({ threshold, bins });
  } catch (error) {
    console.error("Error in getCriticalBins:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}