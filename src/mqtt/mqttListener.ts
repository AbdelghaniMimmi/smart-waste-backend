import mqtt, { MqttClient } from "mqtt";
import { WasteBinModel } from "../models/WasteBin";

const MQTT_HOST = "mqtt://broker.hivemq.com";
const MQTT_PORT = 1883;
const MQTT_TOPIC = "smart_waste/#";

let client: MqttClient | null = null;

export function startMqttListener() {
  if (client) return; // لا تبدأ مرتين

  client = mqtt.connect(`${MQTT_HOST}:${MQTT_PORT}`);

  client.on("connect", () => {
    console.log("MQTT connected to", MQTT_HOST);
    client!.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        console.error("MQTT subscribe error:", err);
      } else {
        console.log("Subscribed to topic:", MQTT_TOPIC);
      }
    });
  });

  client.on("error", (err) => {
    console.error("MQTT error:", err);
  });

  client.on("message", async (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());
      console.log("MQTT message on", topic, data);

      const binId: string | undefined = data.bin_id;
      const fillLevel: number | undefined = data.fill_level;   // نسبة الامتلاء %
      const weightKg: number | undefined = data.weight_kg;     // الوزن بالكيلو
      const gps = data.gps || {};
      const lat: number | undefined = gps.lat;
      const lng: number | undefined = gps.lng;

      if (!binId) {
        console.warn("MQTT payload without bin_id, skip");
        return;
      }

      const nowIso = new Date().toISOString();

      const update: any = {
        lastUpdate: nowIso,
      };

      if (typeof fillLevel === "number") {
        update.lastFillLevel = fillLevel;
      }

      if (typeof weightKg === "number") {
        update.lastWeight = weightKg;
      }

      if (typeof lat === "number") {
        update.latitude = lat;
      }

      if (typeof lng === "number") {
        update.longitude = lng;
      }

      // upsert: إذا لم توجد الحاوية، أنشئها؛ وإن وجدت، حدّثها
      await WasteBinModel.findOneAndUpdate(
        { binId },
        { $set: update },
        { upsert: true, new: true }
      );

      console.log(`WasteBin ${binId} updated`);

    } catch (err) {
      console.error("MQTT message parse/save error:", err);
      console.log("Raw payload:", payload.toString());
    }
  });
}