// GET  /api/platform/departments — public, list all departments
// POST /api/platform/departments — webmaster only, create department

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const all = searchParams.get("all") === "true";

    const db = await getDb();
    const filter: Record<string, unknown> = {};
    if (!all) filter.isActive = true;
    if (search) filter.name = { $regex: search, $options: "i" };

    const departments = await Collections.departments(db)
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      departments: departments.map((d) => ({
        id: d._id!.toString(),
        name: d.name,
        isActive: d.isActive,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      total: departments.length,
    });
  } catch (err) {
    console.error("[GET /api/platform/departments]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
        { error: "Department name is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    const existing = await Collections.departments(db).findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 409 },
      );
    }

    const { insertedId } = await Collections.departments(db).insertOne({
      name: name.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        message: "Department created successfully",
        department: {
          id: insertedId.toString(),
          name: name.trim(),
          isActive: true,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/platform/departments]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
