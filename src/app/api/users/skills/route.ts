// app/api/users/skills/route.ts
// PATCH — replace user's skills array
// Body example:
// {
//   "skills": ["programming", "design", "leadership"]
// }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { updateUserSkills, sanitizeProfile } from "@/lib/services/userService";

async function patchHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    if (!("skills" in body)) {
      return NextResponse.json(
        { error: 'Body must include a "skills" array' },
        { status: 400 },
      );
    }

    const result = await updateUserSkills(db, vaultId, body.skills);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({
      message: "Skills updated successfully",
      profile: sanitizeProfile(result.updated!),
    });
  } catch (err) {
    console.error("[PATCH /api/users/skills]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const PATCH = withAuth(patchHandler);
