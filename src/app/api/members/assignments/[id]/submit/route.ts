// src/app/api/members/assignments/[id]/submit/route.ts
// ─── POST /api/members/assignments/[id]/submit ────────────────────────────────
// Member submits deliverables for an assignment they own.
//
// Constraints:
//   • taskType must be "submission" — poll/survey have separate flows (Phase 1b)
//   • Member must own the assignment (userId match)
//   • Submission only valid from: pending | in_progress | revision_requested
//   • All required deliverables must be present
//   • Deadline enforced (overriddenDeadline takes precedence over task.deadline)
//   • If task.autoEvaluate === true → fires Gemini bot immediately (AUTO_SUBMIT)
//   • Bot failure is NON-FATAL — assignment stays readable, moves to under_review

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId, WithId } from "mongodb";
import { runBotEvaluation } from "@/lib/services/botEvaluationService";
import type { SubmitAssignmentPayload } from "@/types/tasks";
import type { DbAssignment, DbTask } from "@/lib/db/dbTypes";

export const POST = withAuth(async (req: AuthenticatedRequest, context) => {
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
        { error: "Approved membership is required to submit assignments" },
        { status: 403 },
      );
    }

    // ── 2. Ownership check ────────────────────────────────────────────────────
    // userId must match userData._id — members can never touch another's assignment

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

    // ── 3. Status gate ────────────────────────────────────────────────────────

    const submittableStatuses = new Set([
      "pending",
      "in_progress",
      "revision_requested",
    ]);

    if (!submittableStatuses.has(assignment.status)) {
      return NextResponse.json(
        {
          error: `Cannot submit from current status: "${assignment.status}"`,
          currentStatus: assignment.status,
          allowedFrom: [...submittableStatuses],
        },
        { status: 409 },
      );
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

    // ── 5. Task type guard ────────────────────────────────────────────────────
    // Poll and survey submissions use separate routes (Phase 1b).
    // Acknowledgement tasks use a dedicated acknowledge endpoint.
    // This route is exclusively for "submission" type tasks.

    if (task.taskType !== "submission") {
      return NextResponse.json(
        {
          error: `This endpoint only handles "submission" type tasks. Task type is "${task.taskType}"`,
          taskType: task.taskType,
        },
        { status: 422 },
      );
    }

    // ── 6. Deadline check ─────────────────────────────────────────────────────
    // Per-assignment override takes precedence over task-level deadline

    const effectiveDeadline = new Date(
      assignment.overriddenDeadline ?? task.deadline,
    );

    if (new Date() > effectiveDeadline) {
      return NextResponse.json(
        {
          error: "Submission deadline has passed",
          deadline: effectiveDeadline,
          isOverridden: !!assignment.overriddenDeadline,
        },
        { status: 422 },
      );
    }

    // ── 7. Parse body ─────────────────────────────────────────────────────────

    let body: SubmitAssignmentPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "At least one submission item is required" },
        { status: 400 },
      );
    }

    // ── 8. Required deliverable validation ────────────────────────────────────
    // Every deliverable marked required: true must have a matching item in body.items

    const requiredLabels = (task.deliverables ?? [])
      .filter((d) => d.required)
      .map((d) => d.label);

    const submittedLabels = new Set(body.items.map((i) => i.deliverableLabel));

    const missing = requiredLabels.filter((l) => !submittedLabels.has(l));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required deliverables",
          missing,
        },
        { status: 422 },
      );
    }

    // ── 9. Write submission ───────────────────────────────────────────────────

    const now = new Date();
    const isResubmission = assignment.status === "revision_requested";

    const newSubmission = {
      items: body.items,
      submittedAt: now,
      additionalNotes: body.additionalNotes?.trim() ?? "",
    };

    // When resubmitting after a revision request, stamp the most recent open
    // revisionHistory entry with resubmittedAt via arrayFilter.
    // On a first submission the arrayFilter targets no documents — safe no-op.
    await Collections.assignments(db).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "submitted",
          submission: newSubmission,
          updatedAt: now,
          ...(isResubmission && {
            "revisionHistory.$[last].resubmittedAt": now,
          }),
        },
      },
      isResubmission
        ? { arrayFilters: [{ "last.resubmittedAt": { $exists: false } }] }
        : {},
    );

    // ── 10. Auto-evaluate ─────────────────────────────────────────────────────
    // runBotEvaluation expects WithId<DbAssignment> and WithId<DbTask>.
    // We reconstruct the assignment with the updated submission before passing it in.

    let botTriggered = false;
    let evaluationPreview = null;

    if (task.autoEvaluate) {
      try {
        // Build the updated assignment shape with new submission stamped in.
        // Casting through unknown is intentional — the DB doc and WithId shape
        // are structurally identical; we just synthesise the updated submission
        // rather than doing a redundant findOne round-trip before the bot call.
        const updatedAssignment: WithId<DbAssignment> = {
          ...(assignment as WithId<DbAssignment>),
          status: "submitted",
          submission: newSubmission,
          updatedAt: now,
        };

        const result = await runBotEvaluation(db, {
          assignment: updatedAssignment,
          task: task as WithId<DbTask>,
          trigger: "AUTO_SUBMIT",
          requestedBy: vaultId,
        });

        botTriggered = true;
        evaluationPreview = {
          score: result.evaluation.totalScore,
          maxScore: result.evaluation.maxScore,
          percentage: result.evaluation.percentageScore,
          flaggedForHumanReview: result.flaggedForHumanReview,
          // Return full feedback only if not flagged — otherwise a human will
          // write the final feedback and we don't want to bias the member.
          feedback: result.flaggedForHumanReview
            ? "Your submission is under review."
            : result.evaluation.feedback,
        };
      } catch (botErr) {
        // Bot failure is intentionally non-fatal.
        // runBotEvaluation already wrote the failure BotActionLog and moved
        // the assignment to "under_review" before throwing — nothing more needed here.
        console.error(
          "[members/assignments/submit] autoEvaluate failed — queued for human review:",
          botErr,
        );
      }
    }

    // ── 11. Fetch and return the final assignment state ───────────────────────
    // Re-fetch so the response always reflects the true DB state
    // (bot may have further updated status + evaluation in step 10)

    const finalAssignment = await Collections.assignments(db).findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: isResubmission
        ? "Resubmission recorded successfully"
        : "Assignment submitted successfully",
      assignment: finalAssignment,
      botTriggered,
      evaluationPreview,
    });
  } catch (err) {
    console.error("[POST /api/members/assignments/[id]/submit]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
