// src/lib/services/botEvaluationService.ts
// ─── Orchestration layer: prompt → Gemini → DB writes → points credit → return ──
// Shared entry-point for both:
//   POST /api/members/assignments/[id]/submit   (autoEvaluate trigger)
//   POST /api/members/bot/evaluate              (manual / re-evaluate trigger)
//
// The service is the ONLY code that writes to assignments and bot_action_logs
// during an evaluation cycle, AND (as of Phase 3) the only code that computes
// and credits time-decay points for submission tasks evaluated by the bot.

import { Db, ObjectId, WithId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import { buildEvaluationPrompt, callGeminiEvaluate } from "./geminiService";
import { calculateSubmissionPoints } from "./timeDecayService";
import { creditTaskPoints } from "./pointsService";
import type { EvaluationResult, BotTrigger } from "@/types/tasks";
import { DbAssignment, DbTask } from "../db/dbTypes";

// ─── Public Interface ──────────────────────────────────────────────────────────

export interface BotEvaluationInput {
  assignment: WithId<DbAssignment>;
  task: WithId<DbTask>;
  trigger: BotTrigger;
  requestedBy: string;
}

export interface BotEvaluationOutput {
  evaluation: EvaluationResult;
  logId: ObjectId;
  flaggedForHumanReview: boolean;
}

// ─── Main Orchestrator ─────────────────────────────────────────────────────────

export async function runBotEvaluation(
  db: Db,
  input: BotEvaluationInput,
): Promise<BotEvaluationOutput> {
  const { assignment, task, trigger } = input;

  if (!assignment.submission?.items?.length) {
    throw new Error("Assignment has no submission items — cannot evaluate");
  }

  const assignmentId = new ObjectId(assignment._id);
  const taskId = new ObjectId(task._id);
  const userId = new ObjectId(assignment.userId);
  const now = new Date();

  // ── 1. Build prompt ────────────────────────────────────────────────────────

  const prompt = buildEvaluationPrompt(
    {
      title: task.title,
      description: task.description,
      evaluationCriteria: task.evaluationCriteria,
      maxScore: task.maxScore,
    },
    assignment.submission,
  );

  // ── 2. Snapshot for audit log ────────────────────────────────────────────

  const inputPayload = {
    submissionText: assignment.submission.items
      .map((i) => `${i.deliverableLabel}: ${i.value}`)
      .join(" | "),
    evaluationCriteria: task.evaluationCriteria ?? "",
    taskTitle: task.title,
    taskDescription: task.description,
    maxScore: task.maxScore,
  };

  // ── 3. Call Gemini ─────────────────────────────────────────────────────────

  let geminiResult: Awaited<ReturnType<typeof callGeminiEvaluate>> | null =
    null;
  let callError: string | null = null;

  try {
    geminiResult = await callGeminiEvaluate(prompt);
  } catch (err) {
    callError = err instanceof Error ? err.message : String(err);
  }

  // ── 4a. FAILURE PATH ───────────────────────────────────────────────────────

  if (!geminiResult || callError) {
    await Collections.botActionLogs(db).insertOne({
      assignmentId,
      taskId,
      userId,
      committeeSlug: assignment.committeeSlug,
      trigger,
      inputPayload,
      rawGeminiResponse: "",
      parsedResult: null,
      tokensUsed: null,
      processingMs: 0,
      modelVersion: "gemini-1.5-flash",
      success: false,
      errorMessage: callError ?? "Unknown error",
      createdAt: now,
      updatedAt: now,
    });

    await Collections.assignments(db).updateOne(
      { _id: assignmentId },
      { $set: { status: "under_review", updatedAt: now } },
    );

    throw new Error(`Bot evaluation failed: ${callError}`);
  }

  // ── 4b. SUCCESS PATH ───────────────────────────────────────────────────────

  const { parsed, rawText, tokensUsed, modelVersion, processingMs } =
    geminiResult;

  // ── 5. Compute time-decay points (submission tasks only, points > 0) ───────
  // This is the new Phase 3 logic. We only attempt the calculation when:
  //   - the task is a submission type (always true here, but checked for
  //     safety since this service is submission-pipeline-specific)
  //   - task.pointsReward > 0 (zero-point tasks skip scoring entirely)
  //   - task.publishedAt is set (it must be, since an active task always has
  //     this stamped — but we guard defensively in case of legacy data)
  //   - assignment.submission.submittedAt is set (always true post-submit)
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
      evaluationPercentage: parsed.percentageScore,
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

  const evaluation: EvaluationResult = {
    totalScore: parsed.totalScore,
    maxScore: task.maxScore,
    percentageScore: parsed.percentageScore,
    feedback: parsed.feedback,
    criteriaBreakdown: parsed.criteriaBreakdown,
    evaluatorId: "GEMINI_BOT",
    evaluatorType: "GEMINI_BOT",
    evaluatedAt: now,
    flaggedForHumanReview: parsed.flaggedForHumanReview,
    reviewNote: parsed.reviewNote ?? undefined,
    ...(pointsAwarded && { pointsAwarded }),
  };

  // Flagged submissions stay under_review for human confirmation;
  // clean evaluations go straight to evaluated.
  const newStatus = parsed.flaggedForHumanReview ? "under_review" : "evaluated";

  // ── 6. Atomic parallel writes: assignment update + log insert ─────────────

  const [, logInsert] = await Promise.all([
    Collections.assignments(db).updateOne(
      { _id: assignmentId },
      {
        $set: {
          status: newStatus,
          evaluation,
          updatedAt: now,
        },
      },
    ),
    Collections.botActionLogs(db).insertOne({
      assignmentId,
      taskId,
      userId,
      committeeSlug: assignment.committeeSlug,
      trigger,
      inputPayload,
      rawGeminiResponse: rawText,
      parsedResult: { ...evaluation },
      tokensUsed,
      processingMs,
      modelVersion,
      success: true,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    }),
  ]);

  // ── 7. Credit points (fire-and-forget, non-blocking) ────────────────────────
  // Only credit if NOT flagged for human review — a flagged submission's
  // evaluation isn't final yet, so points wait until a human confirms or
  // overrides via the manual evaluate route. Once confirmed there, that
  // route credits points using the SAME pointsAwarded snapshot computed here
  // (it does not recompute the time multiplier, since the multiplier was
  // already frozen at the original submission's submittedAt).
  if (
    pointsAwarded &&
    pointsAwarded.totalPoints > 0 &&
    !parsed.flaggedForHumanReview
  ) {
    void (async () => {
      try {
        await creditTaskPoints({
          db,
          userId,
          assignmentId,
          taskId,
          taskTitle: task.title,
          amount: pointsAwarded!.totalPoints,
          source: "task_completion",
          taskScore: parsed.totalScore,
          taskMaxScore: task.maxScore,
        });
      } catch (err) {
        console.error(
          "[botEvaluationService] Points credit failed (non-fatal):",
          err,
        );
      }
    })();
  }

  return {
    evaluation,
    logId: logInsert.insertedId,
    flaggedForHumanReview: parsed.flaggedForHumanReview,
  };
}
