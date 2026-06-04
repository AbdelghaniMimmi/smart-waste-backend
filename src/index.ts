import express, { Request, Response } from "express";
import sensorRoutes from "./routes/sensorRoutes";
import binRoutes from "./routes/binRoutes";
import { connectToDatabase } from "./db";
import { startMqttListener } from "./mqtt/mqttListener"; // أضف هذا السطر
import authRoutes from "./routes/authRoutes";
import settingsRoutes from "./routes/settingsRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Smart Waste Backend is running" });
});

// جميع الراوتات تحت /api
app.use("/api", sensorRoutes);
app.use("/api", binRoutes);
app.use("/api", authRoutes);
app.use("/api", settingsRoutes);

async function start() {
  await connectToDatabase();
  console.log("MongoDB connected");

  // تشغيل HTTP server
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  // تشغيل مستمع MQTT بعد نجاح الاتصال بقاعدة البيانات
  startMqttListener();
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});