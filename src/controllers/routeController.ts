import { Request, Response } from "express";
import { WasteBinModel } from "../models/WasteBin";
import {
  Point,
  nearestNeighborRoute,
  cheapestInsertionRoute,
  totalRouteDistance
} from "../utils/routeUtils";

export async function getOptimizedRoutes(req: Request, res: Response) {
  try {
    const threshold = Number(req.query.threshold ?? 80);

    // جلب الحاويات الحرجة من قاعدة البيانات
    const bins = await WasteBinModel.find({
      lastFillLevel: { $ne: null, $gte: threshold }
    });

    if (bins.length === 0) {
      return res.json({
        message: "لا توجد حاويات حرجة بهذا العتبة",
        threshold
      });
    }

    // تحويل بيانات الحاويات لنقاط Points
    const points: Point[] = bins.map((bin: any) => ({
      id: bin.binId ?? bin._id.toString(),
      latitude: bin.latitude,
      longitude: bin.longitude
    }));

    // تجاهل أي حاوية بدون إحداثيات صحيحة
    const validPoints = points.filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number"
    );

    if (validPoints.length < 2) {
      return res.json({
        message: "عدد الحاويات ذات الإحداثيات غير كافٍ لحساب مسار",
        count: validPoints.length
      });
    }

    // مسار Nearest Neighbor
    const nnRoute = nearestNeighborRoute(validPoints);
    const nnDistance = totalRouteDistance(nnRoute);

    // مسار Cheapest Insertion
    const ciRoute = cheapestInsertionRoute(validPoints);
    const ciDistance = totalRouteDistance(ciRoute);

    return res.json({
      threshold,
      binsCount: validPoints.length,
      nearestNeighbor: {
        totalDistanceKm: nnDistance,
        order: nnRoute.map((p) => p.id)
      },
      cheapestInsertion: {
        totalDistanceKm: ciDistance,
        order: ciRoute.map((p) => p.id)
      }
    });
  } catch (error) {
    console.error("Error in getOptimizedRoutes:", error);
    return res.status(500).json({
      message: "Erreur serveur lors du calcul du trajet",
      error: (error as Error).message
    });
  }
}