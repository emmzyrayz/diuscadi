// PATCH /api/users/institution
// Saves institution + faculty + department + level to UserData.Institution
// Also looks up InstitutionDepartment junction for degreeType + durationYears

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { institutionId, facultyId, departmentId, level } = body as {
      institutionId: string;
      facultyId: string;
      departmentId: string;
      level?: string;
    };

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
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const db = await getDb();

    // ── Fetch all three documents in parallel ──────────────────────────────
    const [institution, faculty, department, junctionDoc] = await Promise.all([
      Collections.institutions(db).findOne(
        { _id: new ObjectId(institutionId) },
        { projection: { name: 1, abbreviation: 1, type: 1 } },
      ),
      Collections.faculties(db).findOne(
        { _id: new ObjectId(facultyId) },
        { projection: { name: 1 } },
      ),
      Collections.departments(db).findOne(
        { _id: new ObjectId(departmentId) },
        { projection: { name: 1 } },
      ),
      // Try to find junction doc for this exact three-way pairing
      Collections.institutionDepartments(db).findOne({
        institutionId: new ObjectId(institutionId),
        facultyId: new ObjectId(facultyId),
        departmentId: new ObjectId(departmentId),
      }),
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

    // ── Validate level against junction durationYears if available ──────────
    if (level && junctionDoc?.durationYears) {
      const { max } = junctionDoc.durationYears;
      const degreeType = junctionDoc.degreeType;
      // Parse level number: "300" → 3, "ND2" → 2, "HND1" → 1
      const levelNum = parseInt(level.replace(/[^0-9]/g, ""));
      const maxLevelNum =
        degreeType === "ND" || degreeType === "HND" ? max : max;
      if (levelNum > maxLevelNum) {
        return NextResponse.json(
          {
            error: `Level ${level} exceeds maximum for this program (${max} years)`,
          },
          { status: 400 },
        );
      }
    }

    // ── Build Institution subdoc ────────────────────────────────────────────
    const institutionUpdate: Record<string, unknown> = {
      institutionId: new ObjectId(institutionId),
      name: institution.name,
      abbreviation: institution.abbreviation ?? "",
      Type: institution.type as "University" | "Polytechnic",
      facultyId: new ObjectId(facultyId),
      faculty: faculty.name,
      departmentId: new ObjectId(departmentId),
      department: department.name,
      // From junction doc (read-only metadata — not user-settable)
      degreeType: junctionDoc?.degreeType ?? null,
      durationYears: junctionDoc?.durationYears ?? null,
    };

    if (level) institutionUpdate.level = level;

    // Preserve existing fields (schoolEmail, gpaRecord, cgpa, etc.)
    const vaultId = new ObjectId(req.auth.vaultId);
    const existing = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { Institution: 1 } },
    );

    const merged = {
      ...(existing?.Institution ?? {}),
      ...institutionUpdate,
      // Always preserve these — never overwrite from this route
      gpaRecord: existing?.Institution?.gpaRecord ?? [],
      cgpa: existing?.Institution?.cgpa ?? null,
      verifiedSchoolEmail: existing?.Institution?.verifiedSchoolEmail ?? false,
    };

    const result = await Collections.userData(db).findOneAndUpdate(
      { vaultId },
      { $set: { Institution: merged, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Institution updated successfully",
      institution: {
        institutionId: institutionId,
        name: institution.name,
        abbreviation: institution.abbreviation,
        faculty: faculty.name,
        department: department.name,
        level: level ?? null,
        degreeType: junctionDoc?.degreeType ?? null,
        durationYears: junctionDoc?.durationYears ?? null,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/users/institution]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
