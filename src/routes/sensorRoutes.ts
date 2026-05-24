import { Router } from "express";
import { createSensorReading, getSensorReadings } from "../controllers/sensorController";

const router = Router();

router.post("/sensor-data", createSensorReading);
router.get("/sensor-data", getSensorReadings);

export default router;