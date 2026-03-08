// GET  /api/platform/institutions/[id]/faculties — public
//   Returns all faculties assigned to this institution, each populated
//   with their departments list.
// POST /api/platform/institutions/[id]/faculties — webmaster only
//   Assigns an existing faculty to this institution.
//   Body: { facultyId }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { NextRequest } from "next/server";

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
        { error: "Invalid institution ID" },
        { status: 400 },
      );
    }

    const db = await getDb();

    const institution = await Collections.institutions(db).findOne(
      { _id: new ObjectId(id) },
      { projection: { faculties: 1, name: 1 } },
    );
    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 },
      );
    }

    // Fetch all assigned faculties and populate their departments
    const faculties =
      institution.faculties.length > 0
        ? await Collections.faculties(db)
            .find({ _id: { $in: institution.faculties } })
            .sort({ name: 1 })
            .toArray()
        : [];

    // Fetch all departments referenced across all faculties
    const allDeptIds = faculties.flatMap((f) => f.departments);
    const departments =
      allDeptIds.length > 0
        ? await Collections.departments(db)
            .find({ _id: { $in: allDeptIds } })
            .sort({ name: 1 })
            .toArray()
        : [];
    const deptMap = new Map(departments.map((d) => [d._id!.toString(), d]));

    return NextResponse.json({
      institutionId: id,
      institutionName: institution.name,
      faculties: faculties.map((f) => ({
        id: f._id!.toString(),
        name: f.name,
        isActive: f.isActive,
        departments: f.departments
          .map((dId) => deptMap.get(dId.toString()))
          .filter(Boolean)
          .map((d) => ({
            id: d!._id!.toString(),
            name: d!.name,
            isActive: d!.isActive,
          })),
      })),
      total: faculties.length,
    });
  } catch (err) {
    console.error("[GET /api/platform/institutions/[id]/faculties]", err);
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
          { error: "Invalid institution ID" },
          { status: 400 },
        );
      }

      const { facultyId } = await req.json();
      if (!facultyId || !ObjectId.isValid(facultyId)) {
        return NextResponse.json(
          { error: "Valid facultyId is required" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const institutionOId = new ObjectId(id);
      const facultyOId = new ObjectId(facultyId);

      // Confirm both exist
      const [institution, faculty] = await Promise.all([
        Collections.institutions(db).findOne({ _id: institutionOId }),
        Collections.faculties(db).findOne({ _id: facultyOId }),
      ]);
      if (!institution)
        return NextResponse.json(
          { error: "Institution not found" },
          { status: 404 },
        );
      if (!faculty)
        return NextResponse.json(
          { error: "Faculty not found" },
          { status: 404 },
        );

      // Check not already assigned
      if (institution.faculties.some((f) => f.toString() === facultyId)) {
        return NextResponse.json(
          { error: "Faculty is already assigned to this institution" },
          { status: 409 },
        );
      }

      await Collections.institutions(db).updateOne(
        { _id: institutionOId },
        {
          $push: { faculties: facultyOId } as never,
          $set: { updatedAt: new Date() },
        },
      );

      return NextResponse.json({
        message: "Faculty assigned to institution successfully",
        institutionId: id,
        facultyId,
        facultyName: faculty.name,
      });
    } catch (err) {
      console.error("[POST /api/platform/institutions/[id]/faculties]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
