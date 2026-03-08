// GET  /api/platform/faculties — public, list all faculties
// POST /api/platform/faculties — webmaster only, create faculty

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

// ── GET — public ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const all = searchParams.get("all") === "true";

    const db = await getDb();
    const filter: Record<string, unknown> = {};
    if (!all) filter.isActive = true;
    if (search) filter.name = { $regex: search, $options: "i" };

    const faculties = await Collections.faculties(db)
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      faculties: faculties.map((f) => ({
        id: f._id!.toString(),
        name: f.name,
        isActive: f.isActive,
        departments: f.departments.map((d) => d.toString()),
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      total: faculties.length,
    });
  } catch (err) {
    console.error("[GET /api/platform/faculties]", err);
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

    const { name } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Faculty name is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    // Check duplicate
    const existing = await Collections.faculties(db).findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A faculty with this name already exists" },
        { status: 409 },
      );
    }

    const { insertedId } = await Collections.faculties(db).insertOne({
      name: name.trim(),
      isActive: true,
      departments: [],
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        message: "Faculty created successfully",
        faculty: {
          id: insertedId.toString(),
          name: name.trim(),
          isActive: true,
          departments: [],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/platform/faculties]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
