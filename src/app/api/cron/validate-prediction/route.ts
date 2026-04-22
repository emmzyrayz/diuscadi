// GET /api/cron/validate-predictions
// Vercel Cron — runs daily at 00:05 WAT (23:05 UTC).
// Compares yesterday's predicted check-in curve against what actually happened,
// calculates per-hour error, stores bias vector for future prediction correction.
// Free Vercel account: max 1 cron job per day — this is it.

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { predictCheckinCurve } from "@/lib/analytics/predictCheckinCurve";

// WAT = UTC+1
function getYesterdayWAT(): { dateStr: string; start: Date; end: Date } {
  const now = new Date();
  // Shift to WAT
  const watNow = new Date(now.getTime() + 60 * 60 * 1000);
  // Yesterday in WAT
  const yesterday = new Date(watNow);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  // Midnight-to-midnight WAT = 23:00–23:00 UTC
  const start = new Date(`${dateStr}T23:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 1); // previous day 23:00 UTC
  const end = new Date(`${dateStr}T23:00:00.000Z`);

  return { dateStr, start, end };
}

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron, not a random visitor
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const { dateStr, start, end } = getYesterdayWAT();

    // ── Check if already ran today ────────────────────────────────────────
    const existing = await Collections.predictionLogs(db).findOne({
      date: dateStr,
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: `Already validated for ${dateStr}`,
      });
    }

    // ── Fetch yesterday's visit data (what fed the prediction) ────────────
    const visitDocs = (await Collections.pageVisits(db)
      .aggregate([
        { $match: { timestamp: { $gte: start, $lt: end } } },
        { $group: { _id: "$hour", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray()) as { _id: number; count: number }[];

    const visitMap: Record<number, number> = Object.fromEntries(
      visitDocs.map((v) => [v._id, v.count]),
    );
    const maxVisits = Math.max(1, ...Object.values(visitMap));

    const hourlyVisits = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: visitMap[hour] ?? 0,
      volume: Math.round(((visitMap[hour] ?? 0) / maxVisits) * 100),
    }));

    // ── Fetch the most recent bias vector (from previous day's log) ───────
    const prevLog = await Collections.predictionLogs(db).findOne(
      {},
      { sort: { appliedAt: -1 } },
    );
    const prevBias = prevLog?.biasVector ?? new Array(24).fill(0);

    // ── Run yesterday's prediction (same logic as the live chart) ─────────
    const predicted = predictCheckinCurve(hourlyVisits, undefined, prevBias);

    // ── Fetch actual check-ins for yesterday ──────────────────────────────
    const checkinDocs = (await Collections.eventRegistrations(db)
      .aggregate([
        {
          $match: {
            status: "checked-in",
            checkedInAt: { $gte: start, $lt: end },
          },
        },
        {
          $project: {
            // Extract WAT hour from checkedInAt
            hour: {
              $mod: [
                { $add: [{ $hour: "$checkedInAt" }, 1] }, // UTC+1
                24,
              ],
            },
          },
        },
        { $group: { _id: "$hour", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray()) as { _id: number; count: number }[];

    const checkinMap: Record<number, number> = Object.fromEntries(
      checkinDocs.map((c) => [c._id, c.count]),
    );
    const maxCheckins = Math.max(1, ...Object.values(checkinMap));
    const totalCheckinDataPoints = checkinDocs.reduce((s, c) => s + c.count, 0);

    // Normalise actual check-ins to 0–100
    const actualNormalised = Array.from({ length: 24 }, (_, hour) =>
      Math.round(((checkinMap[hour] ?? 0) / maxCheckins) * 100),
    );

    // ── Calculate error per hour + new bias vector ────────────────────────
    // bias = actual - predicted (how much we need to shift each hour)
    // We blend: newBias = 0.7 * prevBias + 0.3 * todayError
    // This gives the model memory — it doesn't overcorrect on a single day
    const slots = Array.from({ length: 24 }, (_, hour) => {
      const predVol = predicted.find((p) => p.hour === hour)?.volume ?? 0;
      const actVol = actualNormalised[hour];
      const error = actVol - predVol;
      return { hour, predicted: predVol, actual: actVol, error };
    });

    const newBiasVector = slots.map((s, hour) => {
      const blended = 0.7 * (prevBias[hour] ?? 0) + 0.3 * s.error;
      // Cap bias at ±30 to prevent runaway correction
      return Math.max(-30, Math.min(30, Math.round(blended)));
    });

    // ── Calculate accuracy metrics ────────────────────────────────────────
    const mae = slots.reduce((sum, s) => sum + Math.abs(s.error), 0) / 24;
    const accuracyPct = Math.max(0, Math.round(100 - mae));

    // ── Write prediction log ──────────────────────────────────────────────
    await Collections.predictionLogs(db).insertOne({
      date: dateStr,
      slots,
      totalPredicted: slots.reduce((s, h) => s + h.predicted, 0),
      totalActual: slots.reduce((s, h) => s + h.actual, 0),
      maeScore: Math.round(mae),
      accuracyPct,
      biasVector: newBiasVector,
      appliedAt: new Date(),
      visitDataPoints: visitDocs.reduce((s, v) => s + v.count, 0),
      checkinDataPoints: totalCheckinDataPoints,
    });

    console.log(
      `[cron/validate-predictions] ${dateStr} — MAE: ${mae.toFixed(1)}, Accuracy: ${accuracyPct}%, Bias updated`,
    );

    return NextResponse.json({
      ok: true,
      date: dateStr,
      maeScore: Math.round(mae),
      accuracyPct,
      biasVector: newBiasVector,
      visitDataPoints: visitDocs.reduce((s, v) => s + v.count, 0),
      checkinDataPoints: totalCheckinDataPoints,
    });
  } catch (err) {
    console.error("[cron/validate-predictions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
