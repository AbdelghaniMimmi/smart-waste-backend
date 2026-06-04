export type Point = {
  id: string;
  latitude: number;
  longitude: number;
};

const R = 6371; // نصف قطر الأرض بالكيلومتر

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// مسافة Haversine بالكيلومتر بين نقطتين جغرافيتين
export function haversineDistance(a: Point, b: Point): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

// حساب المسافة الكلية لمسار (cycle) مثل 0→1→2→0
export function totalRouteDistance(route: Point[], distanceFn = haversineDistance): number {
  if (route.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += distanceFn(route[i], route[i + 1]);
  }
  // العودة لنقطة البداية (مسار دائري)
  total += distanceFn(route[route.length - 1], route[0]);
  return total;
}

//==================================================================
// مسار Nearest Neighbor: نبدأ من أول نقطة في القائمة
export function nearestNeighborRoute(points: Point[]): Point[] {
  if (points.length <= 1) return points;

  const remaining = [...points];
  const route: Point[] = [];

  // نبدأ من أول نقطة
  let current = remaining.shift()!;
  route.push(current);

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }

    current = remaining.splice(bestIndex, 1)[0];
    route.push(current);
  }

  return route;
}

//==================================================================
// مسار Cheapest Insertion: نُنشئ مساراً تدريجياً بإدخال النقاط في الموضع الأرخص
export function cheapestInsertionRoute(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  const remaining = [...points];

  // نبدأ بمسار مكوّن من نقطتين: أول نقطتين في القائمة
  const route: Point[] = [];
  const start = remaining.shift()!;
  const second = remaining.shift()!;
  route.push(start, second);

  // ندخل باقي النقاط
  while (remaining.length > 0) {
    const p = remaining.shift()!;

    let bestIndex = 0;
    let bestIncrease = Infinity;

    // نجرب إدخال p بين كل زوج متتالي في المسار
    for (let i = 0; i < route.length; i++) {
      const nextIndex = (i + 1) % route.length;
      const a = route[i];
      const b = route[nextIndex];

      const currentDist = haversineDistance(a, b);
      const newDist =
        haversineDistance(a, p) + haversineDistance(p, b);

      const increase = newDist - currentDist;

      if (increase < bestIncrease) {
        bestIncrease = increase;
        bestIndex = nextIndex;
      }
    }

    route.splice(bestIndex, 0, p);
  }

  return route;
}