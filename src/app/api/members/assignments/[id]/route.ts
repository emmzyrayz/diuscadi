// src/app/api/members/assignments/[id]/route.ts
// ─── GET /api/members/assignments/[id] ────────────────────────────────────────
// Returns the full assignment document owned by the authenticated member.
// Includes: complete submission items, full evaluation with criteriaBreakdown
// and feedback, append-only revisionHistory, and parent task summary.
// This is the Phase 3 unlock for EvaluationCard full breakdown rendering.

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const { vaultId } = req.auth;

    // ── 1. Membership gate ────────────────────────────────────────────────────

    const userData = await Collections.userData(db).findOne({
      vaultId: new ObjectId(vaultId),
    });

    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }
    if (userData.membershipStatus !== "approved") {
      return NextResponse.json(
        { error: "Approved membership required" },
        { status: 403 },
      );
    }

    // ── 2. Fetch assignment — ownership enforced via userId match ─────────────
    // A member can never read another member's assignment through this route.

    const assignment = await Collections.assignments(db).findOne({
      _id: new ObjectId(id),
      userId: userData._id as ObjectId,
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // ── 3. Fetch parent task summary ──────────────────────────────────────────
    // Only the fields needed to render SubmissionSheet — not the full doc.

    const task = await Collections.tasks(db).findOne(
      { _id: assignment.taskId as ObjectId },
      {
        projection: {
          title: 1,
          description: 1,
          committeeSlug: 1,
          deliverables: 1,
          maxScore: 1,
          evaluationCriteria: 1,
          autoEvaluate: 1,
          deadline: 1,
          taskType: 1,
        },
      },
    );

    return NextResponse.json({ assignment, task: task ?? null });
  } catch (err) {
    console.error("[GET /api/members/assignments/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
