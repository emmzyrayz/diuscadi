// src/app/api/platform/config/route.ts
// GET /api/platform/config — PUBLIC
// Returns safe subset of platform config for client-side feature flag checks.
// Does NOT expose debugTargets (user IDs) to the public — only returns
// whether the current user is a debug target (resolved server-side).

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { PLATFORM_CONFIG_DEFAULTS } from "@/lib/models/platformConfig";
import { verifyJWT } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const db = await getDb();
    const records = await Collections.platformConfig(db).find({}).toArray();

    const raw: Record<string, unknown> = { ...PLATFORM_CONFIG_DEFAULTS };
    for (const r of records) {
      raw[r.key] = r.value;
    }

    // Resolve debugMode for the current user without exposing all targets
    let isDebugTarget = false;
    const authHeader = req.headers.get("Authorization");
    if (raw.debugMode === true && authHeader?.startsWith("Bearer ")) {
      try {
        const payload = verifyJWT(authHeader.slice(7));
        const targets = (raw.debugTargets ?? []) as string[];
        isDebugTarget =
          targets.includes("all") || targets.includes(payload.vaultId);
      } catch {
        /* unauthenticated — not a debug target */
      }
    }

    // Public-safe config — strip debugTargets
    return NextResponse.json({
      config: {
        inviteMode: raw.inviteMode,
        registrationOpen: raw.registrationOpen,
        eventsOpen: raw.eventsOpen,
        applicationsOpen: raw.applicationsOpen,
        maintenanceMode: raw.maintenanceMode,
        registrationFee: raw.registrationFee,
        // ── Referral config (full ladder now exposed) ─────────────────────
        referralBonusPoints: raw.referralBonusPoints,
        referralDepth2BonusPoints: raw.referralDepth2BonusPoints,
        referralDepth3BonusPoints: raw.referralDepth3BonusPoints,
        referralMaxDepth: raw.referralMaxDepth,
        referralDiscountPercent: raw.referralDiscountPercent,
        // ─────────────────────────────────────────────────────────────────
        showBanners: raw.showBanners,
        showGallery: raw.showGallery,
        debugMode: raw.debugMode,
        isDebugTarget,
      },
    });
  } catch (err) {
    console.error("[GET /api/platform/config]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
