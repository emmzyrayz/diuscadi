// GET /api/admin/health
// Webmaster only. Returns aggregated browser + performance analysis.
// Query: ?days=7|14|30|90 (default 30)
//
// Returns:
// - Browser breakdown: visit count, avg metrics, error rate per browser
// - OS breakdown
// - Device breakdown
// - Network breakdown
// - Slowest pages
// - Pages with highest JS error rates
// - Best/worst browser ranked by composite score

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (req.auth.role !== "webmaster") {
      return NextResponse.json(
        { error: "Webmaster access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const days = Math.min(
      90,
      Math.max(1, parseInt(searchParams.get("days") ?? "30")),
    );
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const matchRange = { reportedAt: { $gte: since } };

    const db = await getDb();

    const [
      totalReports,
      browserStats,
      osStats,
      deviceStats,
      networkStats,
      slowestPages,
      errorPages,
      errorsByBrowser,
    ] = await Promise.all([
      Collections.healthReports(db).countDocuments(matchRange),

      // Browser: visits + avg perf metrics
      Collections.healthReports(db)
        .aggregate([
          { $match: matchRange },
          {
            $group: {
              _id: "$browser.name",
              visits: { $sum: 1 },
              avgTtfb: { $avg: "$ttfb" },
              avgFcp: { $avg: "$fcp" },
              avgLcp: { $avg: "$lcp" },
              avgLoad: { $avg: "$windowOnLoad" },
              errorDocs: {
                $sum: {
                  $cond: [
                    { $gt: [{ $size: { $ifNull: ["$jsErrors", []] } }, 0] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $sort: { visits: -1 } },
        ])
        .toArray(),

      // OS breakdown
      Collections.healthReports(db)
        .aggregate([
          { $match: matchRange },
          {
            $group: {
              _id: "$os.name",
              visits: { $sum: 1 },
              avgLcp: { $avg: "$lcp" },
            },
          },
          { $sort: { visits: -1 } },
        ])
        .toArray(),

      // Device breakdown
      Collections.healthReports(db)
        .aggregate([
          { $match: matchRange },
          {
            $group: {
              _id: "$device",
              visits: { $sum: 1 },
              avgLcp: { $avg: "$lcp" },
            },
          },
          { $sort: { visits: -1 } },
        ])
        .toArray(),

      // Network type breakdown
      Collections.healthReports(db)
        .aggregate([
          { $match: matchRange },
          {
            $group: {
              _id: "$networkType",
              visits: { $sum: 1 },
              avgLcp: { $avg: "$lcp" },
            },
          },
          { $sort: { visits: -1 } },
        ])
        .toArray(),

      // Top 10 slowest pages by avg LCP
      Collections.healthReports(db)
        .aggregate([
          { $match: { ...matchRange, lcp: { $exists: true } } },
          {
            $group: {
              _id: "$page",
              avgLcp: { $avg: "$lcp" },
              visits: { $sum: 1 },
            },
          },
          { $match: { visits: { $gte: 3 } } }, // ignore pages with < 3 data points
          { $sort: { avgLcp: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      // Top 10 pages by JS error rate
      Collections.healthReports(db)
        .aggregate([
          { $match: matchRange },
          {
            $group: {
              _id: "$page",
              visits: { $sum: 1 },
              errorDocs: {
                $sum: {
                  $cond: [
                    { $gt: [{ $size: { $ifNull: ["$jsErrors", []] } }, 0] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $match: { visits: { $gte: 3 }, errorDocs: { $gt: 0 } } },
          {
            $addFields: {
              errorRate: { $divide: ["$errorDocs", "$visits"] },
            },
          },
          { $sort: { errorRate: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      // JS errors grouped by browser
      Collections.healthReports(db)
        .aggregate([
          { $match: { ...matchRange, "jsErrors.0": { $exists: true } } },
          { $unwind: "$jsErrors" },
          {
            $group: {
              _id: { browser: "$browser.name", message: "$jsErrors.message" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ])
        .toArray(),
    ]);

    // Compute composite score per browser (lower = better)
    // Score = normalised average of: LCP weight 40%, FCP 30%, TTFB 20%, errorRate 10%
    const browserAnalysis = browserStats.map((b) => {
      const errorRate = b.visits > 0 ? (b.errorDocs / b.visits) * 100 : 0;
      return {
        browser: b._id ?? "Unknown",
        visits: b.visits,
        avgTtfbMs: b.avgTtfb ? Math.round(b.avgTtfb) : null,
        avgFcpMs: b.avgFcp ? Math.round(b.avgFcp) : null,
        avgLcpMs: b.avgLcp ? Math.round(b.avgLcp) : null,
        avgLoadMs: b.avgLoad ? Math.round(b.avgLoad) : null,
        errorRatePct: Math.round(errorRate * 10) / 10,
        // LCP rating: <2500 good, <4000 needs improvement, >=4000 poor
        lcpRating: b.avgLcp
          ? b.avgLcp < 2500
            ? "good"
            : b.avgLcp < 4000
              ? "needs-improvement"
              : "poor"
          : null,
      };
    });

    // Rank browsers: sort by avgLcp ascending (nulls last)
    const ranked = [...browserAnalysis].sort((a, b) => {
      if (a.avgLcpMs === null) return 1;
      if (b.avgLcpMs === null) return -1;
      return a.avgLcpMs - b.avgLcpMs;
    });

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      totalReports,
      browsers: browserAnalysis,
      browserRanking: ranked.map((b, i) => ({
        rank: i + 1,
        browser: b.browser,
        avgLcpMs: b.avgLcpMs,
        lcpRating: b.lcpRating,
        errorRatePct: b.errorRatePct,
        visits: b.visits,
        verdict:
          i === 0 && b.avgLcpMs
            ? `Best performing browser on this platform`
            : b.lcpRating === "poor"
              ? `Poor LCP — investigate rendering issues`
              : b.errorRatePct > 10
                ? `High JS error rate — possible compatibility issues`
                : "Acceptable performance",
      })),
      os: osStats.map((o) => ({
        os: o._id ?? "Unknown",
        visits: o.visits,
        avgLcpMs: o.avgLcp ? Math.round(o.avgLcp) : null,
      })),
      devices: deviceStats.map((d) => ({
        device: d._id ?? "Unknown",
        visits: d.visits,
        avgLcpMs: d.avgLcp ? Math.round(d.avgLcp) : null,
      })),
      network: networkStats.map((n) => ({
        type: n._id ?? "unknown",
        visits: n.visits,
        avgLcpMs: n.avgLcp ? Math.round(n.avgLcp) : null,
      })),
      slowestPages: slowestPages.map((p) => ({
        page: p._id,
        avgLcpMs: Math.round(p.avgLcp),
        visits: p.visits,
        rating:
          p.avgLcp < 2500
            ? "good"
            : p.avgLcp < 4000
              ? "needs-improvement"
              : "poor",
      })),
      errorPages: errorPages.map((p) => ({
        page: p._id,
        visits: p.visits,
        errorDocs: p.errorDocs,
        errorRatePct: Math.round(p.errorRate * 1000) / 10,
      })),
      topJsErrors: errorsByBrowser.map((e) => ({
        browser: e._id.browser,
        message: e._id.message,
        count: e.count,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[GET /api/admin/health]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
