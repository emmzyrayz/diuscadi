// GET  /api/platform/faculties/[id]/departments — public
//   Returns all departments assigned to this faculty.
// POST /api/platform/faculties/[id]/departments — webmaster only
//   Assigns an existing department to this faculty.
//   Body: { departmentId }

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

// ── GET — public ──────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, context?: Context) {
  try {
    const params = context?.params ? await Promise.resolve(context.params) : {};
    const id = params.id as string;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid faculty ID" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const faculty = await Collections.faculties(db).findOne(
      { _id: new ObjectId(id) },
      { projection: { departments: 1, name: 1 } },
    );
    if (!faculty)
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });

    const departments =
      faculty.departments.length > 0
        ? await Collections.departments(db)
            .find({ _id: { $in: faculty.departments } })
            .sort({ name: 1 })
            .toArray()
        : [];

    return NextResponse.json({
      facultyId: id,
      facultyName: faculty.name,
      departments: departments.map((d) => ({
        id: d._id!.toString(),
        name: d.name,
        isActive: d.isActive,
      })),
      total: departments.length,
    });
  } catch (err) {
    console.error("[GET /api/platform/faculties/[id]/departments]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── POST — webmaster only ─────────────────────────────────────────────────────
export const POST = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      if (req.auth.role !== "webmaster") {
        return NextResponse.json(
          { error: "Webmaster access required" },
          { status: 403 },
        );
      }

      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const id = params.id as string;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid faculty ID" },
          { status: 400 },
        );
      }

      const { departmentId } = await req.json();
      if (!departmentId || !ObjectId.isValid(departmentId)) {
        return NextResponse.json(
          { error: "Valid departmentId is required" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const facultyOId = new ObjectId(id);
      const departmentOId = new ObjectId(departmentId);

      const [faculty, department] = await Promise.all([
        Collections.faculties(db).findOne({ _id: facultyOId }),
        Collections.departments(db).findOne({ _id: departmentOId }),
      ]);
      if (!faculty)
        return NextResponse.json(
          { error: "Faculty not found" },
          { status: 404 },
        );
      if (!department)
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 },
        );

      if (faculty.departments.some((d) => d.toString() === departmentId)) {
        return NextResponse.json(
          { error: "Department is already assigned to this faculty" },
          { status: 409 },
        );
      }

      await Collections.faculties(db).updateOne(
        { _id: facultyOId },
        {
          $push: { departments: departmentOId } as never,
          $set: { updatedAt: new Date() },
        },
      );

      return NextResponse.json({
        message: "Department assigned to faculty successfully",
        facultyId: id,
        departmentId,
        departmentName: department.name,
      });
    } catch (err) {
      console.error("[POST /api/platform/faculties/[id]/departments]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
