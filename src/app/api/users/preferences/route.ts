// app/api/users/preferences/route.ts
// GET  — return current user's preferences (with defaults for missing fields)
// PATCH — update one or more preference sections: notifications, appearance, privacy
//
// Body examples:
//   { "notifications": { "frequency": "daily", "marketing": true } }
//   { "appearance":    { "theme": "dark", "accent": "violet" } }
//   { "privacy":       { "profilePrivate": true } }
//   Multiple sections can be sent in one request.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/lib/services/userService";

// ─── GET /api/users/preferences ───────────────────────────────────────────────

async function getHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const preferences = await getUserPreferences(db, vaultId);
    return NextResponse.json({ preferences });
  } catch (err) {
    console.error("[GET /api/users/preferences]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/users/preferences ─────────────────────────────────────────────

async function patchHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const ALLOWED_SECTIONS = ["notifications", "appearance", "privacy"];
    const unknown = Object.keys(body).filter(
      (k) => !ALLOWED_SECTIONS.includes(k),
    );
    if (unknown.length > 0) {
      return NextResponse.json(
        { error: `Unknown preference sections: ${unknown.join(", ")}` },
        { status: 400 },
      );
    }

    const result = await updateUserPreferences(db, vaultId, body);
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({
      message: "Preferences updated",
      preferences: (result.updated as { preferences: unknown }).preferences,
    });
  } catch (err) {
    console.error("[PATCH /api/users/preferences]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
