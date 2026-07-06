// src/app/api/admin/tasks/task/[id]/activate/route.ts
// ─── POST /api/admin/tasks/task/[id]/activate ─────────────────────────────────────
// Transitions a draft task → active and spawns its assignment documents.
//
// This is the "Publish" endpoint for draft tasks created with
// publishImmediately=false. It wraps activateTask() from taskService.
//
// CHANGED for Phase 3: pending_approval tasks are explicitly rejected here
// with a 409 pointing to the dedicated /approve route. This route only
// ever transitions draft → active; it never approves a global task draft.
// Keeping the two paths separate avoids a confused state where a committee
// HEAD could accidentally hit "activate" on their own pending global task
// and have it silently fail or behave unexpectedly.
//
// Permission matrix:
//   admin | webmaster   →  any task, any committee
//   HEAD | COORDINATOR  →  only tasks belonging to their own committee
//
// Idempotent: calling this on an already-active task returns 200 with
// { spawned: 0, skipped: 0 } rather than an error.

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { activateTask } from "@/lib/services/taskService";

export const POST = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const db = await getDb();
    const { vaultId, role } = req.auth;

    // ── 1. Fetch the task first ───────────────────────────────────────────────

    const task = await Collections.tasks(db).findOne({
      _id: new ObjectId(id),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ── 2. Reject pending_approval tasks — wrong endpoint ──────────────────────
    // A global task awaiting approval must go through
    // POST /api/admin/tasks/task/[id]/approve, never this route. This keeps
    // the two activation paths cleanly separated and prevents a committee
    // HEAD/COORDINATOR (who has activate access for their own committee
    // tasks) from accidentally trying to self-activate a global draft.

    if (task.status === "pending_approval") {
      return NextResponse.json(
        {
          error:
            "This task is pending approval. Use POST " +
            "/api/admin/tasks/task/[id]/approve (webmaster/head-admin only) " +
            "to publish a global task awaiting approval.",
          currentStatus: task.status,
        },
        { status: 409 },
      );
    }

    // ── 3. Status guard ───────────────────────────────────────────────────────

    const inactivatableStatuses = new Set(["cancelled", "archived"]);

    if (inactivatableStatuses.has(task.status)) {
      return NextResponse.json(
        {
          error: `Cannot activate a task with status "${task.status}"`,
          currentStatus: task.status,
        },
        { status: 409 },
      );
    }

    // ── 4. Permission check ───────────────────────────────────────────────────

    const isSystemAdmin = role === "admin" || role === "webmaster";

    if (!isSystemAdmin) {
      const userData = await Collections.userData(db).findOne({
        vaultId: new ObjectId(vaultId),
      });

      if (!userData) {
        return NextResponse.json(
          { error: "User profile not found" },
          { status: 404 },
        );
      }

      const isCommitteeStaff =
        userData.membershipStatus === "approved" &&
        userData.committeeMembership?.committee === task.committeeSlug &&
        ["HEAD", "COORDINATOR"].includes(
          userData.committeeMembership?.role ?? "",
        );

      if (!isCommitteeStaff) {
        return NextResponse.json(
          {
            error:
              "Insufficient permissions. Requires admin/webmaster role, " +
              `or HEAD/COORDINATOR of committee "${task.committeeSlug}".`,
          },
          { status: 403 },
        );
      }
    }

    // ── 5. Already active — idempotent no-op ──────────────────────────────────

    if (task.status === "active") {
      return NextResponse.json({
        message: "Task is already active",
        task,
        assignments: { spawned: 0, skipped: 0 },
        alreadyActive: true,
      });
    }

    // ── 6. Activate + spawn (also stamps publishedAt) ─────────────────────────

    const spawnResult = await activateTask(db, new ObjectId(id));

    const updatedTask = await Collections.tasks(db).findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: `Task activated. ${spawnResult.spawned} assignment(s) created.`,
      task: updatedTask,
      assignments: spawnResult,
      alreadyActive: false,
    });
  } catch (err) {
    console.error("[POST /api/admin/tasks/task/[id]/activate]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
