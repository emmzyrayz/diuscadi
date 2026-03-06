// app/api/users/institution/route.ts
// PATCH — update institution information
// Body example:
// {
//   "Type": "University",
//   "name": "University of Benin",
//   "department": "Computer Science",
//   "faculty": "Engineering",
//   "level": "300",
//   "semester": "First",
//   "graduationYear": 2026,
//   "currentStatus": "Active"
// }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  updateUserInstitution,
  sanitizeProfile,
} from "@/lib/services/userService";

async function patchHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 },
      );
    }

    const result = await updateUserInstitution(db, vaultId, {
      Type: body.Type,
      name: body.name,
      department: body.department,
      faculty: body.faculty,
      level: body.level,
      semester: body.semester,
      graduationYear: body.graduationYear,
      currentStatus: body.currentStatus,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({
      message: "Institution updated successfully",
      profile: sanitizeProfile(result.updated!),
    });
  } catch (err) {
    console.error("[PATCH /api/users/institution]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const PATCH = withAuth(patchHandler);
