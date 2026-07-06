// src/app/api/admin/tasks/task/[id]/approve/route.ts
// ─── POST /api/admin/tasks/task/[id]/approve ──────────────────────────────────
// Approves a global task that is sitting in "pending_approval" status,
// transitioning it to "active" and spawning assignments for every approved
// platform member (or the configured assignmentTarget subset).
//
// Permission: webmaster or head-admin ONLY. This is the one place in the
// task system where committee HEAD/COORDINATOR access is explicitly
// excluded — they can draft and submit global tasks, but cannot approve
// their own or anyone else's.
//
// Idempotent: calling this on an already-active task returns 200 with a
// no-op spawn result rather than an error, matching the pattern used by
// the committee-task /activate route.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { approveGlobalTask } from "@/lib/services/taskService";

// Roles permitted to approve a global task. Deliberately narrower than the
// admin/webmaster check used elsewhere — "head-admin" is a distinct concept
// from a committee HEAD and is resolved via the vault role field, not
// committeeMembership.
const APPROVER_ROLES = ["webmaster", "admin"] as const;

export const POST = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const { role } = req.auth;

    // ── 1. Permission check — webmaster/admin only, no committee staff ────────
    if (!APPROVER_ROLES.includes(role as (typeof APPROVER_ROLES)[number])) {
      return NextResponse.json(
        {
          error:
            "Only a webmaster or head-admin can approve global tasks. " +
            "Committee HEAD/COORDINATOR roles cannot self-approve global submissions.",
        },
        { status: 403 },
      );
    }

    const db = await getDb();

    // ── 2. Fetch the task ──────────────────────────────────────────────────────
    const task = await Collections.tasks(db).findOne({ _id: new ObjectId(id) });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ── 3. Scope guard — this route is exclusively for global tasks ───────────
    if (task.scope !== "global") {
      return NextResponse.json(
        {
          error:
            "This route only approves global-scope tasks. Committee-scope " +
            "tasks are activated directly via the /activate endpoint.",
        },
        { status: 400 },
      );
    }

    // ── 4. Already active — idempotent no-op ──────────────────────────────────
    if (task.status === "active") {
      return NextResponse.json({
        message: "Task is already active",
        task,
        assignments: { spawned: 0, skipped: 0 },
        alreadyActive: true,
      });
    }

    // ── 5. Status guard — must be pending_approval ─────────────────────────────
    if (task.status !== "pending_approval") {
      return NextResponse.json(
        {
          error: `Cannot approve a task with status "${task.status}". Only "pending_approval" tasks can be approved.`,
          currentStatus: task.status,
        },
        { status: 409 },
      );
    }

    // ── 6. Approve + spawn ──────────────────────────────────────────────────────
    const spawnResult = await approveGlobalTask(db, new ObjectId(id));

    const updatedTask = await Collections.tasks(db).findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: `Global task approved and published. ${spawnResult.spawned} assignment(s) created.`,
      task: updatedTask,
      assignments: spawnResult,
      alreadyActive: false,
    });
  } catch (err) {
    console.error("[POST /api/admin/tasks/task/[id]/approve]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
