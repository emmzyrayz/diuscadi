// src/app/api/members/tasks/route.ts
// ─── GET /api/members/tasks ────────────────────────────────────────────────────
// Returns tasks for the authenticated member's effective committee,
// each enriched with that member's own assignment summary.
// UPDATED Phase 4: returns pollConfig, surveyConfig, pointsReward,
// acceptResponsesAfterDeadline, latenessStretchFactor on each task, and
// adds pollResponseRecorded / surveyResponseRecorded / acknowledgedAtRecorded
// boolean flags to the assignment enrichment so the TaskCard can render
// the correct CTA without fetching the full assignment document.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const { vaultId } = req.auth;

    // ── 1. Fetch UserData — membership gate ───────────────────────────────────

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
        { error: "Approved membership is required to access committee tasks" },
        { status: 403 },
      );
    }

    // ── 2. Resolve effective committee ────────────────────────────────────────

    const now = new Date();
    const effectiveSlug: string | null =
      userData.temporaryAssignment &&
      new Date(userData.temporaryAssignment.endsAt) > now
        ? userData.temporaryAssignment.committee
        : (userData.committeeMembership?.committee ?? null);

    if (!effectiveSlug) {
      return NextResponse.json(
        { error: "No active committee membership found for this account" },
        { status: 400 },
      );
    }

    // ── 3. Query params ───────────────────────────────────────────────────────

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "active";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;

    // ── 4. Build task query ───────────────────────────────────────────────────
    // Scoped to the member's effective committee OR global tasks (scope: "global")
    // that are active and visible. Members see both their committee tasks and
    // any global tasks the platform has published.

    const taskQuery: Record<string, unknown> = {
      $or: [
        { committeeSlug: effectiveSlug, scope: "committee" },
        { scope: "global" },
      ],
      isVisible: true,
    };
    if (statusFilter !== "all") taskQuery.status = statusFilter;

    // ── 5. Fetch tasks + total count (parallel) ───────────────────────────────

    const [tasks, total] = await Promise.all([
      Collections.tasks(db)
        .find(taskQuery)
        .sort({ priority: -1, deadline: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      Collections.tasks(db).countDocuments(taskQuery),
    ]);

    if (tasks.length === 0) {
      return NextResponse.json({
        tasks: [],
        committee: { slug: effectiveSlug },
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }

    // ── 6. Fetch member's assignments for returned tasks (one round-trip) ─────

    const userId = userData._id as ObjectId;
    const taskIds = tasks.map((t) => t._id as ObjectId);

    const assignments = await Collections.assignments(db)
      .find({ taskId: { $in: taskIds }, userId })
      .project({
        taskId: 1,
        status: 1,
        "submission.submittedAt": 1,
        "evaluation.totalScore": 1,
        "evaluation.maxScore": 1,
        "evaluation.percentageScore": 1,
        "evaluation.evaluatedAt": 1,
        "evaluation.flaggedForHumanReview": 1,
        overriddenDeadline: 1,
        revisionHistory: 1,
        // ── Phase 4: instant-complete response presence flags ──────────────
        // We project only the presence indicator (votedAt / submittedAt /
        // acknowledgedAt) rather than the full response payload — the card
        // only needs to know whether the member has already responded, not
        // what they said. The full response is available via the detail route
        // if the UI ever needs it.
        "pollResponse.votedAt": 1,
        "surveyResponse.submittedAt": 1,
        acknowledgedAt: 1,
        instantPointsResult: 1,
      })
      .toArray();

    // ── 7. O(1) lookup map: taskId → assignment ───────────────────────────────

    const assignmentMap = new Map(
      assignments.map((a) => [(a.taskId as ObjectId).toString(), a]),
    );

    // ── 8. Enrich each task with its assignment summary ───────────────────────

    const enriched = tasks.map((task) => {
      const a = assignmentMap.get((task._id as ObjectId).toString()) ?? null;

      return {
        // ── Core task fields ─────────────────────────────────────────────────
        ...task,

        // ── Phase 4: instant-complete task configs ────────────────────────────
        // Always included regardless of taskType so the client doesn't need
        // to guess which fields are present. Undefined for irrelevant types.
        pollConfig: task.pollConfig ?? null,
        surveyConfig: task.surveyConfig ?? null,
        pointsReward: task.pointsReward ?? 0,
        acceptResponsesAfterDeadline: task.acceptResponsesAfterDeadline ?? false,
        latenessStretchFactor: task.latenessStretchFactor ?? 0.5,

        // ── Assignment summary ────────────────────────────────────────────────
        assignment: a
          ? {
              _id: a._id,
              status: a.status,
              submittedAt: a.submission?.submittedAt ?? null,
              score: a.evaluation
                ? {
                    total: a.evaluation.totalScore,
                    max: a.evaluation.maxScore,
                    percentage: a.evaluation.percentageScore,
                  }
                : null,
              evaluatedAt: a.evaluation?.evaluatedAt ?? null,
              flaggedForHumanReview:
                a.evaluation?.flaggedForHumanReview ?? false,
              effectiveDeadline: a.overriddenDeadline ?? task.deadline,
              revisionsRequested: (a.revisionHistory ?? []).length,

              // ── Phase 4: instant-complete response flags ───────────────────
              // Boolean presence indicators — the sheet renders the "already
              // responded" state based on these, never on assignment.status
              // alone (since "evaluated" is also the final status for
              // submission tasks after scoring).
              pollResponseRecorded: !!a.pollResponse?.votedAt,
              surveyResponseRecorded: !!a.surveyResponse?.submittedAt,
              acknowledgedAtRecorded: !!a.acknowledgedAt,

              // Lateness decay snapshot for the card's points-earned display.
              instantPointsResult: a.instantPointsResult ?? null,
            }
          : null,
      };
    });

    // ── 9. Fetch committee display metadata ───────────────────────────────────

    const committee = await Collections.committees(db).findOne(
      { slug: effectiveSlug },
      { projection: { slug: 1, name: 1, color: 1, icon: 1 } },
    );

    return NextResponse.json({
      tasks: enriched,
      committee: committee ?? { slug: effectiveSlug },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/members/tasks]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});