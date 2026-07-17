// src/app/api/admin/assignments/assignment/[id]/evaluate/route.ts
// ─── PATCH /api/admin/assignments/assignment/[id]/evaluate ───────────────────────────────
// Manually evaluates an assignment (admin / committee HEAD path).
//
// CHANGED for Phase 3: now computes time-decay points using the same
// calculateSubmissionPoints() formula the bot pipeline uses, then credits
// points via pointsService. This covers two scenarios:
//   1. A task with autoEvaluate=false — points were never computed by the
//      bot at all, this route is the ONLY place they get calculated.
//   2. A bot evaluation that was flaggedForHumanReview=true — the bot
//      computed pointsAwarded but withheld the credit; an admin override
//      here either confirms that score or replaces it entirely, and THIS
//      evaluation's totalScore (not the bot's) drives the final point credit.
//
// Body:
//   totalScore         number, 0–task.maxScore  (required)
//   feedback           string                   (required)
//   criteriaBreakdown  CriteriaScore[]           (optional)
//   evaluatorType      "MANUAL" | "HYBRID"      (default "MANUAL")
//
// evaluatorId is set to caller's vaultId for human accountability.
// flaggedForHumanReview is always false for manual evaluation — a human
// just made the final call, there's nothing left to flag.

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
import { calculateSubmissionPoints } from "@/lib/services/timeDecayService";
import { creditTaskPoints } from "@/lib/services/pointsService";
import { canEvaluate } from "@/lib/roles";

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

     const isEvaluator = canEvaluate(role);

     if (!isEvaluator) {
       const userData = await Collections.userData(db).findOne({
         vaultId: new ObjectId(vaultId),
       });

       const isCommitteeStaff =
         userData?.membershipStatus === "approved" &&
         userData?.committeeMembership?.committee ===
           assignment.committeeSlug &&
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

    // ── 4. Fetch parent task ──────────────────────────────────────────────────

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

    // ── 6. Compute time-decay points (submission tasks, pointsReward > 0) ─────
    // Uses the assignment's ORIGINAL submission.submittedAt as the clock-stop
    // — a manual review happening days later never penalises the member.
    // The evaluationPercentage fed into the formula is THIS evaluation's
    // score (the human's judgment), not any prior bot score.

    const now = new Date();
    const percentageScore =
      Math.round((body.totalScore / task.maxScore) * 10000) / 100;

    let pointsAwarded: EvaluationResult["pointsAwarded"] | undefined;

    if (
      task.pointsReward > 0 &&
      task.publishedAt &&
      assignment.submission?.submittedAt
    ) {
      const decayResult = calculateSubmissionPoints({
        pointsReward: task.pointsReward,
        qualityWeight: task.qualityWeight ?? 80,
        timeWeight: task.timeWeight ?? 20,
        decayBaseHours: task.decayBaseHours ?? 4,
        passThresholdPercent: task.passThresholdPercent ?? 50,
        evaluationPercentage: percentageScore,
        publishedAt: task.publishedAt,
        submittedAt: assignment.submission.submittedAt,
      });

      pointsAwarded = {
        passed: decayResult.passed,
        qualityPoints: decayResult.qualityPoints,
        timeBonusPoints: decayResult.timeBonusPoints,
        totalPoints: decayResult.totalPoints,
        timeMultiplier: decayResult.timeMultiplier,
        hoursElapsed: decayResult.hoursElapsed,
      };
    }

    // ── 7. Build evaluation document ──────────────────────────────────────────

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
      evaluatorId: vaultId,
      evaluatorType: body.evaluatorType ?? "MANUAL",
      evaluatedAt: now,
      flaggedForHumanReview: false,
      ...(pointsAwarded && { pointsAwarded }),
    };

    // ── 8. Update assignment ──────────────────────────────────────────────────

    const updated = await Collections.assignments(db).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "evaluated", evaluation, updatedAt: now } },
      { returnDocument: "after" },
    );

    // ── 9. Credit points (fire-and-forget, non-blocking) ────────────────────────
    // The idempotency guard in creditTaskPoints (keyed on assignmentId) means
    // this is safe to call even if a prior bot evaluation already credited
    // this assignment — but note: if the bot DID already credit (i.e. it
    // wasn't flagged), this route should not normally be reached again for
    // the same assignment since status would already be "evaluated", not
    // "submitted"/"under_review". The guard exists as a defensive backstop,
    // not the primary correctness mechanism.
    if (pointsAwarded && pointsAwarded.totalPoints > 0) {
      void (async () => {
        try {
          await creditTaskPoints({
            db,
            userId: assignment.userId as ObjectId,
            assignmentId: new ObjectId(id),
            taskId: assignment.taskId as ObjectId,
            taskTitle: task.title,
            amount: pointsAwarded!.totalPoints,
            source: "task_completion",
            taskScore: body.totalScore,
            taskMaxScore: task.maxScore,
          });
        } catch (err) {
          console.error(
            "[admin/evaluate] Points credit failed (non-fatal):",
            err,
          );
        }
      })();
    }

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
