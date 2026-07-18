// src/app/api/admin/tasks/create/route.ts

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  PRIORITY_WEIGHTS,
  spawnAssignments,
  resolveAssignmentTarget,
  validateTaskInput,
} from "@/lib/services/taskService";
import type {
  CreateTaskPayload,
  TaskScope,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/types/tasks";

const SYSTEM_ADMIN_ROLES = ["admin", "webmaster"];

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const { vaultId, role } = req.auth;

    // ── 1. Parse body ─────────────────────────────────────────────────────────

    let body: CreateTaskPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // ── 2. Fetch caller's UserData ────────────────────────────────────────────

    const userData = await Collections.userData(db).findOne({
      vaultId: new ObjectId(vaultId),
    });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // ── 3. Resolve scope (default committee) ──────────────────────────────────

    const scope = (body.scope ?? "committee") as TaskScope;
    const isSystemAdmin = SYSTEM_ADMIN_ROLES.includes(role);

    // ── 4. Permission check ───────────────────────────────────────────────────
    // Committee-scope: HEAD/COORDINATOR of that exact committee, or system admin.
    // Global-scope: ANY HEAD/COORDINATOR/MOD or system admin may DRAFT a global
    //   task, but only system admins can publish it immediately — everyone
    //   else's global task is forced into pending_approval regardless of what
    //   publishImmediately says.
    const isCommitteeStaff =
      userData.membershipStatus === "approved" &&
      userData.committeeMembership?.committee === body.committeeSlug &&
      ["HEAD", "COORDINATOR"].includes(
        userData.committeeMembership?.role ?? "",
      );

    const isAnyCommitteeStaffOrMod =
      userData.membershipStatus === "approved" &&
      ["HEAD", "COORDINATOR", "MOD"].includes(
        userData.committeeMembership?.role ?? "",
      );

    if (scope === "committee") {
      if (!isSystemAdmin && !isCommitteeStaff) {
        return NextResponse.json(
          {
            error:
              "Insufficient permissions. Requires admin/webmaster role, " +
              "or HEAD/COORDINATOR of the target committee.",
          },
          { status: 403 },
        );
      }
    } else {
      // scope === "global"
      if (!isSystemAdmin && !isAnyCommitteeStaffOrMod) {
        return NextResponse.json(
          {
            error:
              "Insufficient permissions to draft a global task. Requires " +
              "admin/webmaster, or HEAD/COORDINATOR/MOD of any committee.",
          },
          { status: 403 },
        );
      }
    }

    // ── 5. Required field validation ──────────────────────────────────────────

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 },
      );
    }
    if (!body.committeeSlug?.trim()) {
      return NextResponse.json(
        {
          error:
            "committeeSlug is required (attribution committee, even for global tasks)",
        },
        { status: 400 },
      );
    }
    if (!body.deadline) {
      return NextResponse.json(
        { error: "deadline is required" },
        { status: 400 },
      );
    }

    const deadlineDate = new Date(body.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { error: "deadline must be a valid ISO 8601 date string" },
        { status: 400 },
      );
    }
    if (deadlineDate <= new Date()) {
      return NextResponse.json(
        { error: "deadline must be in the future" },
        { status: 400 },
      );
    }

    // ── 6. taskType-specific validation ──────────────────────────────────────

    const taskType = (body.taskType ?? "submission") as TaskType;

    if (taskType === "poll") {
      if (!body.pollConfig?.question?.trim()) {
        return NextResponse.json(
          { error: "pollConfig.question is required for poll tasks" },
          { status: 400 },
        );
      }
      if (
        !body.pollConfig.options?.length ||
        body.pollConfig.options.length < 2
      ) {
        return NextResponse.json(
          { error: "pollConfig.options must have at least 2 options" },
          { status: 400 },
        );
      }
    }

    if (taskType === "survey") {
      if (!body.surveyConfig?.questions?.length) {
        return NextResponse.json(
          { error: "surveyConfig.questions is required for survey tasks" },
          { status: 400 },
        );
      }
    }

    if (taskType === "learning") {
      // TODO: implement when PandaAcademy / UniArchive are ready. For now,
      // block creation entirely so admins don't accidentally publish a task
      // type with no working completion pipeline.
      return NextResponse.json(
        {
          error:
            "Learning tasks are not yet available — external platform " +
            "integration is pending. This task type is scaffolded but " +
            "not yet implemented.",
        },
        { status: 501 },
      );
    }

    // ── 6.5. taskBtn validation (any task type) ───────────────────────────────
    if (Array.isArray(body.taskBtn)) {
      for (const btn of body.taskBtn) {
        if (!btn.btnLabel?.trim()) {
          return NextResponse.json(
            { error: "Each action button requires a btnLabel" },
            { status: 400 },
          );
        }
        if (!btn.btnUrl?.trim()) {
          return NextResponse.json(
            { error: "Each action button requires a btnUrl" },
            { status: 400 },
          );
        }
        try {
          const u = new URL(btn.btnUrl.trim());
          if (!["http:", "https:"].includes(u.protocol)) {
            return NextResponse.json(
              { error: `Invalid btnUrl protocol: ${btn.btnUrl}` },
              { status: 400 },
            );
          }
        } catch {
          return NextResponse.json(
            { error: `Invalid btnUrl: ${btn.btnUrl}` },
            { status: 400 },
          );
        }
      }
    }

    // ── 7. Points + time-decay weight validation (submission tasks only) ──────

    const validationError = validateTaskInput({
      taskType,
      qualityWeight: body.qualityWeight,
      timeWeight: body.timeWeight,
    });
    if (validationError) {
      return NextResponse.json(
        { error: validationError.message, field: validationError.field },
        { status: 400 },
      );
    }

    // ── 8. Validate committeeSlug exists ──────────────────────────────────────
    // Required even for global tasks — it's the attribution committee of
    // the creator, shown in the admin UI as "drafted by [committee]".

    const committee = await Collections.committees(db).findOne({
      slug: body.committeeSlug,
    });
    if (!committee) {
      return NextResponse.json(
        { error: `Committee "${body.committeeSlug}" not found` },
        { status: 404 },
      );
    }

    // ── 9. Resolve target status ───────────────────────────────────────────────
    // This is the core of the approval gate:
    //   committee scope + publishImmediately → "active"
    //   committee scope + !publishImmediately → "draft"
    //   global scope + isSystemAdmin + publishImmediately → "active"
    //   global scope + !isSystemAdmin (regardless of publishImmediately)
    //     → "pending_approval" — non-admins can NEVER publish a global task
    //       directly, no matter what they pass in the request body.
    //   global scope + isSystemAdmin + !publishImmediately → "draft"

    let targetStatus: TaskStatus;
    if (scope === "global" && !isSystemAdmin) {
      targetStatus = "pending_approval";
    } else if (body.publishImmediately) {
      targetStatus = "active";
    } else {
      targetStatus = "draft";
    }

    // ── 10. Build and insert task document ─────────────────────────────────────

    const now = new Date();
    const priority = (body.priority ?? "medium") as TaskPriority;
    const assignmentTarget = resolveAssignmentTarget(body.assignmentTarget);
    const isSubmission = taskType === "submission";

    const newTask = {
      title: body.title.trim(),
      description: body.description.trim(),
      committeeSlug: body.committeeSlug.trim(),
      createdBy: new ObjectId(vaultId),
      scope,
      assignmentTarget,
      taskType,
      pollConfig: taskType === "poll" ? body.pollConfig : undefined,
      surveyConfig: taskType === "survey" ? body.surveyConfig : undefined,
      priority,
      priorityWeight: PRIORITY_WEIGHTS[priority],
      status: targetStatus,
      deadline: deadlineDate,
      // publishedAt is stamped only when targetStatus === "active" (below).
      deliverables: taskType === "submission" ? (body.deliverables ?? []) : [],
      taskBtn: (body.taskBtn ?? []).map((btn) => ({
        btnLabel: btn.btnLabel.trim(),
        btnUrl: btn.btnUrl.trim(),
        hoverLabel: btn.hoverLabel?.trim() ?? "",
      })),
      tags: (body.tags ?? []).map((t) => t.toLowerCase().trim()),
      maxScore: body.maxScore ?? 100,
      autoEvaluate:
        taskType === "submission" ? (body.autoEvaluate ?? false) : false,
      evaluationCriteria:
        taskType === "submission"
          ? (body.evaluationCriteria?.trim() ?? "")
          : "",

      // Points config
      pointsReward: body.pointsReward ?? 0,
      ...(isSubmission && {
        qualityWeight: body.qualityWeight ?? 80,
        timeWeight: body.timeWeight ?? 20,
        decayBaseHours: body.decayBaseHours ?? 4,
        passThresholdPercent: body.passThresholdPercent ?? 50,
      }),

      isVisible: true,
      createdAt: now,
      updatedAt: now,
      ...(targetStatus === "active" && { publishedAt: now }),
    };

    const { insertedId } = await Collections.tasks(db).insertOne(newTask);

    // ── 11. Spawn assignments only if publishing immediately ──────────────────
    // pending_approval tasks NEVER spawn assignments — they have no
    // assignees until approveGlobalTask() runs.

    let spawnResult = { spawned: 0, skipped: 0 };
    if (targetStatus === "active") {
      try {
        spawnResult = await spawnAssignments(db, {
          _id: insertedId,
          scope: newTask.scope,
          committeeSlug: newTask.committeeSlug,
          assignmentTarget: newTask.assignmentTarget,
        });
      } catch (spawnErr) {
        console.error("[tasks/create] assignment spawn error:", spawnErr);
      }
    }

    // ── 12. Build response message ──────────────────────────────────────────

    let message: string;
    if (targetStatus === "pending_approval") {
      message =
        "Global task submitted for approval. A webmaster or head-admin " +
        "must approve it before it becomes visible to members.";
    } else if (targetStatus === "active") {
      message = `Task published. ${spawnResult.spawned} assignment(s) created.`;
    } else {
      message = "Task saved as draft.";
    }

    return NextResponse.json(
      {
        message,
        task: { ...newTask, _id: insertedId },
        assignments: spawnResult,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/tasks/create]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
