import { Point } from "../utils/routeUtils";

const OSRM_BASE_URL =
  process.env.OSRM_URL || "https://router.project-osrm.org";
const REQUEST_TIMEOUT_MS = 8000;
const SUCCESS_TTL_MS = 5 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;

export interface RoadRoute {
  /** إحداثيات المسار على الطرق بصيغة [lat, lng] */
  geometry: [number, number][];
  /** المسافة الحقيقية عبر الطرق بالكيلومتر */
  distanceKm: number;
}

const cache = new Map<string, { at: number; value: RoadRoute | null }>();

/**
 * يجلب المسار الحقيقي عبر الطرق من OSRM.
 * يُرجع null عند تعذّر الوصول للخدمة، ليعود الواجهة إلى الخطوط المستقيمة.
 */
export async function getRoadRoute(points: Point[]): Promise<RoadRoute | null> {
  if (points.length < 2) return null;

  // المسار دائري: نعود إلى نقطة الانطلاق كما في حساب المسافة
  const cycle = [...points, points[0]];
  const coordinates = cycle
    .map((p) => `${p.longitude},${p.latitude}`)
    .join(";");

  const cached = cache.get(coordinates);
  if (cached) {
    const ttl = cached.value ? SUCCESS_TTL_MS : FAILURE_TTL_MS;
    if (Date.now() - cached.at < ttl) return cached.value;
  }

  try {
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`OSRM responded with ${response.status}`);
    }

    const data = (await response.json()) as any;
    const route = data?.routes?.[0];

    if (!route?.geometry?.coordinates?.length) {
      throw new Error("OSRM returned no geometry");
    }

    const value: RoadRoute = {
      // OSRM يُرجع [lng, lat] بينما Leaflet ينتظر [lat, lng]
      geometry: route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      ),
      distanceKm: route.distance / 1000,
    };

    cache.set(coordinates, { at: Date.now(), value });
    return value;
  } catch (err) {
    console.error(
      "Road routing unavailable, falling back to straight lines:",
      (err as Error).message
    );
    cache.set(coordinates, { at: Date.now(), value: null });
    return null;
  }
}
