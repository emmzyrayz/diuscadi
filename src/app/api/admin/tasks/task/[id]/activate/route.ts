// src/app/api/admin/tasks/[id]/activate/route.ts
// ─── POST /api/admin/tasks/[id]/activate ─────────────────────────────────────
// Transitions a draft task → active and spawns its assignment documents.
//
// This is the explicit "Publish" endpoint that pairs with the
// publishImmediately=false (draft) creation path. It wraps activateTask()
// from taskService — same spawn logic, explicit route-level permission gate.
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
    // Needed for:
    //   (a) Permission check — HEAD/COORDINATOR need to verify the task's
    //       committeeSlug matches their own membership
    //   (b) Status validation — cancelled/archived tasks must not be re-activated
    //   (c) Response enrichment — return the updated task to the caller

    const task = await Collections.tasks(db).findOne({
      _id: new ObjectId(id),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ── 2. Status guard ───────────────────────────────────────────────────────
    // Only draft tasks are activatable. Active tasks return a no-op response.
    // Cancelled and archived tasks are permanently closed — cannot be re-activated.

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

    // ── 3. Permission check ───────────────────────────────────────────────────

    const isSystemAdmin = role === "admin" || role === "webmaster";

    if (!isSystemAdmin) {
      // Non-system-admins must be approved members with HEAD or COORDINATOR role
      // in the exact committee this task belongs to
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

    // ── 4. Already active — idempotent no-op ──────────────────────────────────
    // Return 200 rather than 409 so the frontend can call this safely on retry
    // without treating it as an error.

    if (task.status === "active") {
      return NextResponse.json({
        message: "Task is already active",
        task,
        assignments: { spawned: 0, skipped: 0 },
        alreadyActive: true,
      });
    }

    // ── 5. Activate + spawn ───────────────────────────────────────────────────
    // activateTask() handles the draft → active transition and creates
    // Assignment documents for all targeted members in a single service call.

    const spawnResult = await activateTask(db, new ObjectId(id));

    // ── 6. Re-fetch the updated task to return its new status ─────────────────

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
    console.error("[POST /api/admin/tasks/[id]/activate]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
