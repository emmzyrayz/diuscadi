// GET  /api/platform/institutions — public, list all active institutions
// POST /api/platform/institutions — webmaster only, create institution

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

// ── GET — public ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "University" | "Polytechnic"
    const state = searchParams.get("state");
    const search = searchParams.get("search"); // name search
    const all = searchParams.get("all") === "true"; // include inactive (webmaster UI)

    const db = await getDb();

    const filter: Record<string, unknown> = {};
    if (!all) filter.isActive = true;
    if (type) filter.type = type;
    if (state) filter.state = state;
    if (search) filter.name = { $regex: search, $options: "i" };

    const institutions = await Collections.institutions(db)
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      institutions: institutions.map((i) => ({
        id: i._id!.toString(),
        name: i.name,
        type: i.type,
        state: i.state,
        country: i.country,
        isActive: i.isActive,
        faculties: i.faculties.map((f) => f.toString()),
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      total: institutions.length,
    });
  } catch (err) {
    console.error("[GET /api/platform/institutions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── POST — webmaster only ─────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (req.auth.role !== "webmaster") {
      return NextResponse.json(
        { error: "Webmaster access required" },
        { status: 403 },
      );
    }

    const { name, type, state, country } = await req.json();

    if (!name || !type || !state || !country) {
      return NextResponse.json(
        { error: "name, type, state, and country are required" },
        { status: 400 },
      );
    }
    if (!["University", "Polytechnic"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'University' or 'Polytechnic'" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    // Check for duplicate name
    const existing = await Collections.institutions(db).findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An institution with this name already exists" },
        { status: 409 },
      );
    }

    const { insertedId } = await Collections.institutions(db).insertOne({
      name: name.trim(),
      type,
      state: state.trim(),
      country: country.trim(),
      isActive: true,
      faculties: [],
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        message: "Institution created successfully",
        institution: {
          id: insertedId.toString(),
          name: name.trim(),
          type,
          state,
          country,
          isActive: true,
          faculties: [],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/platform/institutions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
