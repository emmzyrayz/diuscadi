// GET /api/admin/health/raw
// Webmaster only. Returns raw health report log entries with filters.
// Query: ?browser= ?os= ?device= ?page= ?hasErrors=true &days=30 &page= &limit=

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
    const browser = searchParams.get("browser");
    const os = searchParams.get("os");
    const device = searchParams.get("device");
    const page = searchParams.get("page");
    const hasErrors = searchParams.get("hasErrors") === "true";
    const days = Math.min(
      90,
      Math.max(1, parseInt(searchParams.get("days") ?? "30")),
    );
    const pageNum = Math.max(1, parseInt(searchParams.get("pageNum") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
    const skip = (pageNum - 1) * limit;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter: Record<string, unknown> = { reportedAt: { $gte: since } };

    if (browser) filter["browser.name"] = { $regex: browser, $options: "i" };
    if (os) filter["os.name"] = { $regex: os, $options: "i" };
    if (device) filter.device = device;
    if (page) filter.page = { $regex: page, $options: "i" };
    if (hasErrors) filter["jsErrors.0"] = { $exists: true };

    const db = await getDb();
    const total = await Collections.healthReports(db).countDocuments(filter);
    const docs = await Collections.healthReports(db)
      .find(filter)
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      reports: docs.map((d) => ({
        id: d._id!.toString(),
        userId: d.userId?.toString() ?? null,
        page: d.page,
        referrer: d.referrer ?? null,
        ttfb: d.ttfb ?? null,
        fcp: d.fcp ?? null,
        lcp: d.lcp ?? null,
        domContentLoaded: d.domContentLoaded ?? null,
        windowOnLoad: d.windowOnLoad ?? null,
        browser: d.browser,
        os: d.os,
        device: d.device,
        screen: `${d.screenWidth}x${d.screenHeight}`,
        networkType: d.networkType ?? null,
        jsErrors: d.jsErrors,
        ip: d.ip ?? null,
        reportedAt: d.reportedAt.toISOString(),
      })),
      pagination: {
        page: pageNum,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: pageNum * limit < total,
        hasPrev: pageNum > 1,
      },
      filters: { browser, os, device, page, hasErrors, days },
    });
  } catch (err) {
    console.error("[GET /api/admin/health/raw]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
