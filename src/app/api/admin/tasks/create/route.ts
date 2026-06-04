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
} from "@/lib/services/taskService";
import type {
  CreateTaskPayload,
  TaskScope,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/types/tasks";

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

    // ── 3. Permission check ───────────────────────────────────────────────────

    const isSystemAdmin = role === "admin" || role === "webmaster";
    const isCommitteeStaff =
      userData.membershipStatus === "approved" &&
      userData.committeeMembership?.committee === body.committeeSlug &&
      ["HEAD", "COORDINATOR"].includes(
        userData.committeeMembership?.role ?? "",
      );

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

    // ── 4. Required field validation ──────────────────────────────────────────

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
        { error: "committeeSlug is required" },
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

    // ── 5. taskType-specific validation ──────────────────────────────────────

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

    // ── 6. Validate committeeSlug exists ──────────────────────────────────────

    const committee = await Collections.committees(db).findOne({
      slug: body.committeeSlug,
    });
    if (!committee) {
      return NextResponse.json(
        { error: `Committee "${body.committeeSlug}" not found` },
        { status: 404 },
      );
    }

    // ── 7. Build and insert task document ─────────────────────────────────────

    const now = new Date();
    const priority = (body.priority ?? "medium") as TaskPriority;

    // Resolve the discriminated union → flat DB shape
    const assignmentTarget = resolveAssignmentTarget(body.assignmentTarget);

    const newTask = {
      title: body.title.trim(),
      description: body.description.trim(),
      committeeSlug: body.committeeSlug.trim(),
      createdBy: new ObjectId(vaultId),
      assignmentTarget, // ← replaces specificAssignees
      scope: (body.scope ?? "individual") as TaskScope,
      taskType, // ← new
      pollConfig: taskType === "poll" ? body.pollConfig : undefined, // ← new
      surveyConfig: taskType === "survey" ? body.surveyConfig : undefined, // ← new
      priority,
      priorityWeight: PRIORITY_WEIGHTS[priority],
      status: (body.publishImmediately ? "active" : "draft") as TaskStatus,
      deadline: deadlineDate,
      deliverables: taskType === "submission" ? (body.deliverables ?? []) : [],
      tags: (body.tags ?? []).map((t) => t.toLowerCase().trim()),
      maxScore: body.maxScore ?? 100,
      autoEvaluate:
        taskType === "submission" ? (body.autoEvaluate ?? false) : false,
      evaluationCriteria:
        taskType === "submission"
          ? (body.evaluationCriteria?.trim() ?? "")
          : "",
      isVisible: true,
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await Collections.tasks(db).insertOne(newTask);

    // ── 8. Spawn assignments if publishing immediately ────────────────────────

    let spawnResult = { spawned: 0, skipped: 0 };
    if (body.publishImmediately) {
      try {
        spawnResult = await spawnAssignments(db, {
          _id: insertedId,
          committeeSlug: newTask.committeeSlug,
          assignmentTarget: newTask.assignmentTarget, // ← replaces specificAssignees
        });
      } catch (spawnErr) {
        console.error("[tasks/create] assignment spawn error:", spawnErr);
      }
    }

    return NextResponse.json(
      {
        message: body.publishImmediately
          ? `Task published. ${spawnResult.spawned} assignment(s) created.`
          : "Task saved as draft.",
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
