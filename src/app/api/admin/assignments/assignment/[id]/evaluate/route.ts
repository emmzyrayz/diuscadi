// src/app/api/admin/assignments/assignment/[id]/evaluate/route.ts
// ─── PATCH /api/admin/assignments/assignment/[id]/evaluate ───────────────────────────────
// Manually evaluates an assignment (admin / committee HEAD path).
//
// Body:
//   totalScore         number, 0–task.maxScore  (required)
//   feedback           string                   (required)
//   criteriaBreakdown  CriteriaScore[]           (optional)
//   evaluatorType      "MANUAL" | "HYBRID"      (default "MANUAL")
//
// evaluatorId is set to caller's vaultId for human accountability.
// flaggedForHumanReview is always false for manual evaluation.

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { EvaluationResult } from "@/types/tasks";

interface ManualEvaluationPayload {
  totalScore: number;
  feedback: string;
  criteriaBreakdown?: {
    criterion: string;
    awarded: number;
    maximum: number;
    rationale?: string;
  }[];
  evaluatorType?: "MANUAL" | "HYBRID";
}

export const PATCH = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const { vaultId, role } = req.auth;

    // ── 1. Fetch assignment ───────────────────────────────────────────────────

    const assignment = await Collections.assignments(db).findOne({
      _id: new ObjectId(id),
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // ── 2. Submission guard ───────────────────────────────────────────────────

    if (!assignment.submission?.items?.length) {
      return NextResponse.json(
        { error: "Assignment has no submission — cannot evaluate" },
        { status: 422 },
      );
    }

    // ── 3. Permission check ───────────────────────────────────────────────────

    const isSystemAdmin = role === "admin" || role === "webmaster";

    if (!isSystemAdmin) {
      const userData = await Collections.userData(db).findOne({
        vaultId: new ObjectId(vaultId),
      });

      const isCommitteeStaff =
        userData?.membershipStatus === "approved" &&
        userData?.committeeMembership?.committee === assignment.committeeSlug &&
        ["HEAD", "COORDINATOR"].includes(
          userData?.committeeMembership?.role ?? "",
        );

      if (!isCommitteeStaff) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }
    }

    // ── 4. Fetch parent task for maxScore ceiling ─────────────────────────────

    const task = await Collections.tasks(db).findOne({
      _id: assignment.taskId as ObjectId,
    });

    if (!task) {
      return NextResponse.json(
        { error: "Parent task not found" },
        { status: 404 },
      );
    }

    // ── 5. Parse + validate body ──────────────────────────────────────────────

    let body: ManualEvaluationPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (typeof body.totalScore !== "number") {
      return NextResponse.json(
        { error: "totalScore must be a number" },
        { status: 400 },
      );
    }
    if (body.totalScore < 0 || body.totalScore > task.maxScore) {
      return NextResponse.json(
        { error: `totalScore must be between 0 and ${task.maxScore}` },
        { status: 400 },
      );
    }
    if (!body.feedback?.trim()) {
      return NextResponse.json(
        { error: "feedback is required" },
        { status: 400 },
      );
    }

    // ── 6. Build evaluation document ──────────────────────────────────────────

    const now = new Date();
    const percentageScore =
      Math.round((body.totalScore / task.maxScore) * 10000) / 100;

    const evaluation: EvaluationResult = {
      totalScore: body.totalScore,
      maxScore: task.maxScore,
      percentageScore,
      feedback: body.feedback.trim(),
      criteriaBreakdown: (body.criteriaBreakdown ?? []).map((c) => ({
        criterion: c.criterion,
        awarded: c.awarded,
        maximum: c.maximum,
        rationale: c.rationale ?? "",
      })),
      evaluatorId: vaultId, // Human accountability
      evaluatorType: body.evaluatorType ?? "MANUAL",
      evaluatedAt: now,
      flaggedForHumanReview: false,
    };

    // ── 7. Update assignment ──────────────────────────────────────────────────

    const updated = await Collections.assignments(db).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "evaluated", evaluation, updatedAt: now } },
      { returnDocument: "after" },
    );

    return NextResponse.json({
      message: "Assignment evaluated successfully.",
      assignment: updated,
      evaluation,
    });
  } catch (err) {
    console.error(
      "[PATCH /api/admin/assignments/assignment/[id]/evaluate]",
      err,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
