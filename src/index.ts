import express, { Request, Response } from "express";
import sensorRoutes from "./routes/sensorRoutes";
import binRoutes from "./routes/binRoutes";
import { connectToDatabase } from "./db";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Smart Waste Backend is running" });
});

// جميع الراوتات تحت /api
app.use("/api", sensorRoutes);
app.use("/api", binRoutes);

async function start() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});