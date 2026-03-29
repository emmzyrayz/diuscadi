// GET  /api/admin/settings — admin/webmaster, returns all config key/value pairs
// PATCH /api/admin/settings — admin/webmaster, update one or more keys

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  PLATFORM_CONFIG_DEFAULTS,
  type PlatformConfigKey,
  type PlatformConfigValue,
} from "@/lib/models/platformConfig";

const ALLOWED_ROLES = ["admin", "webmaster"];

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const db = await getDb();
    const records = await Collections.platformConfig(db).find({}).toArray();

    // Merge DB values over defaults — any missing key falls back to default
    const config: Record<string, PlatformConfigValue> = {
      ...PLATFORM_CONFIG_DEFAULTS,
    };
    for (const record of records) {
      config[record.key] = record.value;
    }

    return NextResponse.json({ config });
  } catch (err) {
    console.error("[GET /api/admin/settings]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── PATCH ─────────────────────────────────────────────────────────────────────
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!ALLOWED_ROLES.includes(req.auth.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Body must be a key/value object" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const updatedBy = new ObjectId(req.auth.vaultId);
    const updated: string[] = [];

    for (const [key, value] of Object.entries(body)) {
      // Only allow known keys
      if (!(key in PLATFORM_CONFIG_DEFAULTS)) {
        continue;
      }
      await Collections.platformConfig(db).updateOne(
        { key: key as PlatformConfigKey },
        {
          $set: {
            key: key as PlatformConfigKey,
            value: value as PlatformConfigValue,
            updatedAt: now,
            updatedBy,
          },
        },
        { upsert: true },
      );
      updated.push(key);
    }

    return NextResponse.json({
      message: `Updated: ${updated.join(", ")}`,
      updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/settings]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
