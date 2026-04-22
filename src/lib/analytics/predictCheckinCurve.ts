// lib/analytics/predictCheckinCurve.ts
// Takes real hourly visit distribution + known check-in stats
// and models a predicted check-in arrival curve.
//
// Model: check-ins typically peak 10–20 mins after event start.
// Without per-event hourly data we use visit distribution as a proxy
// for "when users are active", then weight it toward peak event hours
// using a Gaussian bell curve centred on the most active hour.
//
// When real cron data arrives (GET /api/admin/analytics/checkin-hourly),
// replace predictedVolume with real data and use this prediction
// as a benchmark for model accuracy.

interface VisitSlot {
  hour: number;
  volume: number; // 0–100
}

interface HeatmapSlot {
  hour: number;
  volume: number; // final value used by chart (0–100)
  isReal: boolean; // true = from real check-in data, false = predicted
  visitVolume: number; // raw visit volume for reference
}

// Gaussian bell curve centred on `mean` with std deviation `sigma`
function gaussian(x: number, mean: number, sigma: number): number {
  return Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
}

export function predictCheckinCurve(
  hourlyVisits: VisitSlot[],
  realCheckinData?: { hour: number; checkins: number }[],
  biasVector?: number[], // ← new: 24-length correction offsets from cron
): HeatmapSlot[] {
  // If real data exists, still apply bias correction to improve it
  if (realCheckinData && realCheckinData.length > 0) {
    const maxReal = Math.max(1, ...realCheckinData.map((d) => d.checkins));
    const realMap = Object.fromEntries(
      realCheckinData.map((d) => [d.hour, d.checkins])
    );
    return Array.from({ length: 24 }, (_, hour) => {
      const base = Math.round(((realMap[hour] ?? 0) / maxReal) * 100);
      const bias = biasVector?.[hour] ?? 0;
      return {
        hour,
        volume: Math.max(0, Math.min(100, base + bias)),
        isReal: true,
        visitVolume: hourlyVisits.find((v) => v.hour === hour)?.volume ?? 0,
      };
    });
  }

  // ── Prediction mode with bias correction ─────────────────────────────────
  const peakSlot = hourlyVisits.reduce(
    (max, slot) => (slot.volume > max.volume ? slot : max),
    { hour: 10, volume: 0 },
  );
  const peakHour = peakSlot.volume > 0 ? peakSlot.hour : 10;
  const visitMap = Object.fromEntries(hourlyVisits.map((v) => [v.hour, v.volume]));

  const raw = Array.from({ length: 24 }, (_, hour) => {
    const visitWeight = (visitMap[hour] ?? 0) / 100;
    const gaussianWeight = gaussian(hour, peakHour, 3);
    return visitWeight * 0.6 + gaussianWeight * 0.4;
  });

  const maxRaw = Math.max(0.001, ...raw);

  return raw.map((value, hour) => {
    const base = Math.round((value / maxRaw) * 100);
    // Apply bias — clamp to 0–100
    const bias = biasVector?.[hour] ?? 0;
    return {
      hour,
      volume: Math.max(0, Math.min(100, base + bias)),
      isReal: false,
      visitVolume: visitMap[hour] ?? 0,
    };
  });
}
