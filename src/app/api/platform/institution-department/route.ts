// GET  /api/platform/institution-department
//   Query params: institutionId, facultyId, departmentId
//   Returns junction metadata (degreeType, durationYears) for the modal
//
// POST /api/platform/institution-department — webmaster only
//   Creates or updates a junction entry (sets degreeType + durationYears)

import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { DegreeType } from "@/lib/models/Institutiondepartment";

// ── GET — public ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get("institutionId");
    const facultyId = searchParams.get("facultyId");
    const departmentId = searchParams.get("departmentId");

    if (!institutionId || !facultyId || !departmentId) {
      return NextResponse.json(
        { error: "institutionId, facultyId, and departmentId are required" },
        { status: 400 },
      );
    }
    if (
      !ObjectId.isValid(institutionId) ||
      !ObjectId.isValid(facultyId) ||
      !ObjectId.isValid(departmentId)
    ) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const db = await getDb();
    const doc = await Collections.institutionDepartments(db).findOne({
      institutionId: new ObjectId(institutionId),
      facultyId: new ObjectId(facultyId),
      departmentId: new ObjectId(departmentId),
    });

    if (!doc) {
      // Not an error — junction entry just hasn't been created by admin yet
      return NextResponse.json({
        exists: false,
        degreeType: null,
        durationYears: null,
      });
    }

    return NextResponse.json({
      exists: true,
      id: doc._id!.toString(),
      degreeType: doc.degreeType,
      durationYears: doc.durationYears,
      institutionName: doc.institutionName,
      facultyName: doc.facultyName,
      departmentName: doc.departmentName,
    });
  } catch (err) {
    console.error("[GET /api/platform/institution-department]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── POST — webmaster only (upsert) ────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (req.auth.role !== "webmaster") {
      return NextResponse.json(
        { error: "Webmaster access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      institutionId,
      facultyId,
      departmentId,
      degreeType,
      durationYears,
    } = body as {
      institutionId: string;
      facultyId: string;
      departmentId: string;
      degreeType: DegreeType;
      durationYears: { min: number; max: number };
    };

    if (
      !institutionId ||
      !facultyId ||
      !departmentId ||
      !degreeType ||
      !durationYears
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }
    if (
      !ObjectId.isValid(institutionId) ||
      !ObjectId.isValid(facultyId) ||
      !ObjectId.isValid(departmentId)
    ) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    if (
      typeof durationYears.min !== "number" ||
      typeof durationYears.max !== "number"
    ) {
      return NextResponse.json(
        { error: "durationYears.min and .max must be numbers" },
        { status: 400 },
      );
    }
    if (durationYears.min > durationYears.max) {
      return NextResponse.json(
        { error: "durationYears.min cannot exceed max" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Fetch denormalised names
    const [institution, faculty, department] = await Promise.all([
      Collections.institutions(db).findOne(
        { _id: new ObjectId(institutionId) },
        { projection: { name: 1, abbreviation: 1 } },
      ),
      Collections.faculties(db).findOne(
        { _id: new ObjectId(facultyId) },
        { projection: { name: 1 } },
      ),
      Collections.departments(db).findOne(
        { _id: new ObjectId(departmentId) },
        { projection: { name: 1 } },
      ),
    ]);

    if (!institution)
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 },
      );
    if (!faculty)
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    if (!department)
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );

    const now = new Date();
    const query = {
      institutionId: new ObjectId(institutionId),
      facultyId: new ObjectId(facultyId),
      departmentId: new ObjectId(departmentId),
    };

    await Collections.institutionDepartments(db).updateOne(
      query,
      {
        $set: {
          ...query,
          institutionName: institution.name,
          institutionAbbr: institution.abbreviation ?? "",
          facultyName: faculty.name,
          departmentName: department.name,
          degreeType,
          durationYears,
          isActive: true,
          createdBy: new ObjectId(req.auth.vaultId),
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    // Ensure indexes exist
    await Collections.institutionDepartments(db).createIndexes([
      {
        key: { institutionId: 1, facultyId: 1, departmentId: 1 },
        unique: true,
        name: "instdept_triple_unique",
      },
      { key: { institutionId: 1, facultyId: 1 }, name: "instdept_inst_fac" },
      { key: { departmentId: 1 }, name: "instdept_dept" },
      { key: { institutionId: 1 }, name: "instdept_inst" },
    ]);

    return NextResponse.json(
      { message: "Junction entry saved" },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/platform/institution-department]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
