// POST /api/health/report
// Auth required. Client sends RUM metrics after page load.
// Called automatically by a client-side hook after each navigation.
//
// Body shape:
// {
//   page: string,
//   referrer?: string,
//   ttfb?: number,
//   fcp?: number,
//   lcp?: number,
//   domContentLoaded?: number,
//   windowOnLoad?: number,
//   browser: { name: string, version: string },
//   os: { name: string, version: string },
//   device: "mobile" | "tablet" | "desktop",
//   screenWidth: number,
//   screenHeight: number,
//   networkType?: string,
//   jsErrors?: Array<{ message, source?, line?, col? }>
// }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();

    const {
      page,
      referrer,
      ttfb,
      fcp,
      lcp,
      domContentLoaded,
      windowOnLoad,
      browser,
      os,
      device,
      screenWidth,
      screenHeight,
      networkType,
      jsErrors = [],
    } = body;

    // Minimal validation
    if (!page || typeof page !== "string") {
      return NextResponse.json({ error: "page is required" }, { status: 400 });
    }
    if (!browser?.name || !os?.name) {
      return NextResponse.json(
        { error: "browser.name and os.name are required" },
        { status: 400 },
      );
    }
    if (!["mobile", "tablet", "desktop"].includes(device)) {
      return NextResponse.json(
        { error: "device must be 'mobile', 'tablet', or 'desktop'" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Get userData _id from vaultId
    const vaultId = new ObjectId(req.auth.vaultId);
    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1 } },
    );

    const userAgent = req.headers.get("user-agent") ?? "";
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    await Collections.healthReports(db).insertOne({
      userId: userData?._id,
      sessionId: req.auth.sessionId ?? undefined,
      page: page.slice(0, 500),
      referrer: referrer ?? undefined,
      ttfb: typeof ttfb === "number" ? ttfb : undefined,
      fcp: typeof fcp === "number" ? fcp : undefined,
      lcp: typeof lcp === "number" ? lcp : undefined,
      domContentLoaded:
        typeof domContentLoaded === "number" ? domContentLoaded : undefined,
      windowOnLoad: typeof windowOnLoad === "number" ? windowOnLoad : undefined,
      browser: {
        name: String(browser.name).slice(0, 100),
        version: String(browser.version ?? "").slice(0, 50),
      },
      os: {
        name: String(os.name).slice(0, 100),
        version: String(os.version ?? "").slice(0, 50),
      },
      device,
      screenWidth: typeof screenWidth === "number" ? screenWidth : 0,
      screenHeight: typeof screenHeight === "number" ? screenHeight : 0,
      networkType: networkType ?? "unknown",
      jsErrors: Array.isArray(jsErrors)
        ? jsErrors.slice(0, 20).map((e: Record<string, unknown>) => ({
            message: String(e.message ?? "").slice(0, 500),
            source: e.source ? String(e.source).slice(0, 200) : undefined,
            line: typeof e.line === "number" ? e.line : undefined,
            col: typeof e.col === "number" ? e.col : undefined,
          }))
        : [],
      ip,
      userAgent: userAgent.slice(0, 500),
      reportedAt: new Date(),
    });

    return NextResponse.json({ message: "Report received" }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/health/report]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
