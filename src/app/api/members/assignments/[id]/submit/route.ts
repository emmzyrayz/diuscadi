// src/app/api/members/assignments/[id]/submit/route.ts
// ─── POST /api/members/assignments/[id]/submit ────────────────────────────────
// Member submits/responds to an assignment they own. Branches by the parent
// task's taskType:
//
//   "submission"      — existing pipeline: deliverables + optional Gemini bot
//                        evaluation. Time-decay scoring is computed inside
//                        botEvaluationService.ts / the manual evaluate route,
//                        NOT here.
//   "poll"             — instant-complete: records selectedOptionIds, computes
//                        lateness decay against task.deadline, credits points
//                        immediately (no evaluation step).
//   "survey"            — instant-complete: records structured answers, same
//                        lateness decay + immediate points credit.
//   "acknowledgement"   — instant-complete: records a bare confirmation
//                        timestamp, same lateness decay + immediate credit.
//   "learning"          — rejected with 501. TODO: implement when external
//                        edu platforms are ready; assignments for this type
//                        are completed via webhook, never via this route.
//
// All three instant-complete types share one rule: once accepted, the
// assignment moves straight to "evaluated" status (there is nothing left to
// review — a vote, a filled form, or a confirmation click is definitionally
// complete the moment it's recorded). They are also all one-shot — no
// resubmission/revote concept exists for instant-complete tasks.

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId, WithId, Db } from "mongodb";
import { runBotEvaluation } from "@/lib/services/botEvaluationService";
import { calculateInstantTaskPoints } from "@/lib/services/timeDecayService";
import { creditTaskPoints } from "@/lib/services/pointsService";
import type {
  SubmitAssignmentPayload,
  PollResponse,
  SurveyResponse,
} from "@/types/tasks";
import type { DbAssignment, DbTask } from "@/lib/db/dbTypes";

interface PollSubmitPayload {
  selectedOptionIds: string[];
}

interface SurveySubmitPayload {
  answers: { questionId: string; value: string | string[] }[];
}

// ── Shared lateness-decay + points-credit helper ───────────────────────────────
// Used by all three instant-complete handlers. Returns null if the task has
// no point value at all (pointsReward === 0) — in that case there is nothing
// to calculate or credit, and instantPointsResult is simply omitted from the
// assignment document.

async function applyInstantPointsAndCredit(
  db: Db,
  assignment: WithId<DbAssignment>,
  task: WithId<DbTask>,
  respondedAt: Date,
) {
  if (task.pointsReward <= 0) return null;

  const result = calculateInstantTaskPoints({
    pointsReward: task.pointsReward,
    deadline: task.deadline,
    respondedAt,
    acceptResponsesAfterDeadline: task.acceptResponsesAfterDeadline ?? false,
    latenessStretchFactor: task.latenessStretchFactor ?? 0.5,
    decayBaseHours: task.decayBaseHours ?? 4,
  });

  if (result.accepted && result.pointsEarned > 0) {
    const sourceMap = {
      poll: "task_poll",
      survey: "task_survey",
      acknowledgement: "task_acknowledgement",
    } as const;
    const source = sourceMap[task.taskType as keyof typeof sourceMap];

    if (source) {
      // Fire-and-forget — a points-credit failure must never block the
      // member from seeing their response was recorded successfully.
      void (async () => {
        try {
          await creditTaskPoints({
            db,
            userId: assignment.userId as ObjectId,
            assignmentId: assignment._id as ObjectId,
            taskId: task._id as ObjectId,
            taskTitle: task.title,
            amount: result.pointsEarned,
            source,
          });
        } catch (err) {
          console.error(
            `[submit] Instant task points credit failed (non-fatal) for ${task.taskType}:`,
            err,
          );
        }
      })();
    }
  }

  return result;
}

// ── Main handler ────────────────────────────────────────────────────────────

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

    // ── 5. Branch by taskType ─────────────────────────────────────────────────

    if (task.taskType === "submission") {
      return handleSubmissionTask(db, req, id, assignment, task, vaultId);
    }

    if (task.taskType === "poll") {
      return handlePollTask(db, req, id, assignment, task);
    }

    if (task.taskType === "survey") {
      return handleSurveyTask(db, req, id, assignment, task);
    }

    if (task.taskType === "acknowledgement") {
      return handleAcknowledgementTask(db, id, assignment, task);
    }

    if (task.taskType === "learning") {
      // TODO: implement when PandaAcademy / UniArchive webhook integration
      // is ready. Learning task assignments are completed exclusively via
      // POST /api/webhooks/learning, never through this member-facing route.
      return NextResponse.json(
        {
          error:
            "Learning tasks are completed via the external platform, not " +
            "this endpoint. This task type is not yet fully implemented.",
        },
        { status: 501 },
      );
    }

    return NextResponse.json(
      { error: `Unknown taskType: "${task.taskType}"` },
      { status: 422 },
    );
  } catch (err) {
    console.error("[POST /api/members/assignments/[id]/submit]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// handleSubmissionTask — unchanged pipeline from Phase 3.
// ─────────────────────────────────────────────────────────────────────────────

async function handleSubmissionTask(
  db: Db,
  req: AuthenticatedRequest,
  id: string,
  assignment: WithId<DbAssignment>,
  task: WithId<DbTask>,
  vaultId: string,
) {
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

  const requiredLabels = (task.deliverables ?? [])
    .filter((d) => d.required)
    .map((d) => d.label);

  const submittedLabels = new Set(body.items.map((i) => i.deliverableLabel));
  const missing = requiredLabels.filter((l) => !submittedLabels.has(l));

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Missing required deliverables", missing },
      { status: 422 },
    );
  }

  const now = new Date();
  const isResubmission = assignment.status === "revision_requested";

  const newSubmission = {
    items: body.items,
    submittedAt: now,
    additionalNotes: body.additionalNotes?.trim() ?? "",
  };

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

  let botTriggered = false;
  let evaluationPreview = null;

  if (task.autoEvaluate) {
    try {
      const updatedAssignment: WithId<DbAssignment> = {
        ...assignment,
        status: "submitted",
        submission: newSubmission,
        updatedAt: now,
      };

      const result = await runBotEvaluation(db, {
        assignment: updatedAssignment,
        task,
        trigger: "AUTO_SUBMIT",
        requestedBy: vaultId,
      });

      botTriggered = true;
      evaluationPreview = {
        score: result.evaluation.totalScore,
        maxScore: result.evaluation.maxScore,
        percentage: result.evaluation.percentageScore,
        flaggedForHumanReview: result.flaggedForHumanReview,
        feedback: result.flaggedForHumanReview
          ? "Your submission is under review."
          : result.evaluation.feedback,
        pointsAwarded: result.evaluation.pointsAwarded ?? null,
      };
    } catch (botErr) {
      console.error(
        "[submit] autoEvaluate failed — queued for human review:",
        botErr,
      );
    }
  }

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
}

// ─────────────────────────────────────────────────────────────────────────────
// handlePollTask
// ─────────────────────────────────────────────────────────────────────────────

async function handlePollTask(
  db: Db,
  req: AuthenticatedRequest,
  id: string,
  assignment: WithId<DbAssignment>,
  task: WithId<DbTask>,
) {
  const now = new Date();

  // Hard deadline gate — checked BEFORE parsing the body, so a closed poll
  // never even attempts to read or validate a vote.
  if (
    now > new Date(task.deadline) &&
    !(task.acceptResponsesAfterDeadline ?? false)
  ) {
    return NextResponse.json(
      {
        error:
          "This poll closed at its deadline and is no longer accepting votes.",
        deadline: task.deadline,
      },
      { status: 422 },
    );
  }

  // Polls are one-shot — no revote.
  if (assignment.pollResponse) {
    return NextResponse.json(
      { error: "You have already voted on this poll." },
      { status: 409 },
    );
  }

  let body: PollSubmitPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(body.selectedOptionIds) ||
    body.selectedOptionIds.length === 0
  ) {
    return NextResponse.json(
      { error: "selectedOptionIds is required and must be non-empty" },
      { status: 400 },
    );
  }

  const validOptionIds = new Set(
    (task.pollConfig?.options ?? []).map((o) => o.id),
  );
  const invalidIds = body.selectedOptionIds.filter(
    (optId) => !validOptionIds.has(optId),
  );
  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: `Invalid option id(s): ${invalidIds.join(", ")}` },
      { status: 400 },
    );
  }

  if (!task.pollConfig?.allowMultiple && body.selectedOptionIds.length > 1) {
    return NextResponse.json(
      { error: "This poll only allows a single selection" },
      { status: 400 },
    );
  }

  const pollResponse: PollResponse = {
    selectedOptionIds: body.selectedOptionIds,
    votedAt: now,
  };

  const instantResult = await applyInstantPointsAndCredit(
    db,
    assignment,
    task,
    now,
  );

  await Collections.assignments(db).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "evaluated",
        pollResponse,
        updatedAt: now,
        ...(instantResult && { instantPointsResult: instantResult }),
      },
    },
  );

  const finalAssignment = await Collections.assignments(db).findOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({
    message: "Vote recorded successfully",
    assignment: finalAssignment,
    pointsResult: instantResult,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// handleSurveyTask
// ─────────────────────────────────────────────────────────────────────────────

async function handleSurveyTask(
  db: Db,
  req: AuthenticatedRequest,
  id: string,
  assignment: WithId<DbAssignment>,
  task: WithId<DbTask>,
) {
  const now = new Date();

  if (
    now > new Date(task.deadline) &&
    !(task.acceptResponsesAfterDeadline ?? false)
  ) {
    return NextResponse.json(
      {
        error:
          "This survey closed at its deadline and is no longer accepting responses.",
        deadline: task.deadline,
      },
      { status: 422 },
    );
  }

  if (assignment.surveyResponse) {
    return NextResponse.json(
      { error: "You have already completed this survey." },
      { status: 409 },
    );
  }

  let body: SurveySubmitPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.answers) || body.answers.length === 0) {
    return NextResponse.json(
      { error: "answers is required and must be non-empty" },
      { status: 400 },
    );
  }

  const questions = task.surveyConfig?.questions ?? [];
  const requiredQuestionIds = questions
    .filter((q) => q.required)
    .map((q) => q.id);
  const answeredIds = new Set(body.answers.map((a) => a.questionId));
  const missing = requiredQuestionIds.filter((qid) => !answeredIds.has(qid));

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Missing required question answers", missing },
      { status: 422 },
    );
  }

  const surveyResponse: SurveyResponse = {
    answers: body.answers,
    submittedAt: now,
  };

  const instantResult = await applyInstantPointsAndCredit(
    db,
    assignment,
    task,
    now,
  );

  await Collections.assignments(db).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "evaluated",
        surveyResponse,
        updatedAt: now,
        ...(instantResult && { instantPointsResult: instantResult }),
      },
    },
  );

  const finalAssignment = await Collections.assignments(db).findOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({
    message: "Survey response recorded successfully",
    assignment: finalAssignment,
    pointsResult: instantResult,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// handleAcknowledgementTask — no request body needed at all.
// ─────────────────────────────────────────────────────────────────────────────

async function handleAcknowledgementTask(
  db: Db,
  id: string,
  assignment: WithId<DbAssignment>,
  task: WithId<DbTask>,
) {
  const now = new Date();

  if (
    now > new Date(task.deadline) &&
    !(task.acceptResponsesAfterDeadline ?? false)
  ) {
    return NextResponse.json(
      {
        error:
          "This acknowledgement closed at its deadline and is no longer accepting confirmations.",
        deadline: task.deadline,
      },
      { status: 422 },
    );
  }

  if (assignment.acknowledgedAt) {
    return NextResponse.json(
      { error: "You have already acknowledged this task." },
      { status: 409 },
    );
  }

  const instantResult = await applyInstantPointsAndCredit(
    db,
    assignment,
    task,
    now,
  );

  await Collections.assignments(db).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "evaluated",
        acknowledgedAt: now,
        updatedAt: now,
        ...(instantResult && { instantPointsResult: instantResult }),
      },
    },
  );

  const finalAssignment = await Collections.assignments(db).findOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({
    message: "Acknowledgement recorded successfully",
    assignment: finalAssignment,
    pointsResult: instantResult,
  });
}
