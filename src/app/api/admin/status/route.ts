// GET /api/admin/status
// Webmaster only. Pings all infrastructure services and returns
// live health status with latency. Safe to run in production.
//
// Returns:
// {
//   services: {
//     mongodb:   { ok, latencyMs, error? }
//     smtp:      { ok, error? }
//     cloudinary: { ok, latencyMs?, error? }
//     api:       { ok, latencyMs }   ← self-check (always true if this route responds)
//   }
//   allOk: boolean
//   checkedAt: string
// }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (req.auth.role !== "webmaster" && req.auth.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // ── MongoDB ───────────────────────────────────────────────────────────────
    const mongoResult: { ok: boolean; latencyMs: number; error?: string } = {
      ok: false,
      latencyMs: 0,
    };
    try {
      const { getDb } = await import("@/lib/mongodb");
      const start = Date.now();
      const db = await getDb();
      await db.command({ ping: 1 });
      mongoResult.ok = true;
      mongoResult.latencyMs = Date.now() - start;
    } catch (err) {
      mongoResult.error = err instanceof Error ? err.message : "Unknown error";
    }

    // ── SMTP ──────────────────────────────────────────────────────────────────
    const smtpResult: { ok: boolean; error?: string } = { ok: false };
    try {
      const { verifySmtpConnection } = await import("@/utils/mailer");
      const ok = await verifySmtpConnection();
      smtpResult.ok = ok;
      if (!ok) smtpResult.error = "SMTP verify() returned false";
    } catch (err) {
      smtpResult.error = err instanceof Error ? err.message : "Unknown error";
    }

    // ── Cloudinary ────────────────────────────────────────────────────────────
    // Lightweight ping: fetch the Cloudinary ping endpoint using API credentials.
    // Does NOT upload anything — just verifies the API key is valid.
    const cloudinaryResult: {
      ok: boolean;
      latencyMs?: number;
      error?: string;
    } = {
      ok: false,
    };
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        cloudinaryResult.error = "Cloudinary env vars not set";
      } else {
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString(
          "base64",
        );
        const start = Date.now();
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/ping`,
          { headers: { Authorization: `Basic ${credentials}` } },
        );
        cloudinaryResult.latencyMs = Date.now() - start;
        cloudinaryResult.ok = res.ok;
        if (!res.ok) cloudinaryResult.error = `HTTP ${res.status}`;
      }
    } catch (err) {
      cloudinaryResult.error =
        err instanceof Error ? err.message : "Unknown error";
    }

    // ── API self-check ────────────────────────────────────────────────────────
    // If this route is responding, the API gateway is up.
    const apiResult = { ok: true, latencyMs: 0 };

    const allOk =
      mongoResult.ok && smtpResult.ok && cloudinaryResult.ok && apiResult.ok;

    return NextResponse.json({
      allOk,
      checkedAt: new Date().toISOString(),
      services: {
        mongodb: mongoResult,
        smtp: smtpResult,
        cloudinary: cloudinaryResult,
        api: apiResult,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/status]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
