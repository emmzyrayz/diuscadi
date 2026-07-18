// src/app/api/admin/tasks/task/[id]/get/route.ts
import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const SYSTEM_ADMIN_ROLES = ["admin", "webmaster"];

export const GET = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const db = await getDb();
    const { vaultId, role } = req.auth;
    const isSystemAdmin = SYSTEM_ADMIN_ROLES.includes(role);

    // ── 1. Fetch task ──────────────────────────────────────────────────────
    const task = await Collections.tasks(db).findOne({
      _id: new ObjectId(id),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ── 2. Permission check ────────────────────────────────────────────────
    // Read access: anyone can view active tasks, but draft/pending tasks
    // require admin or committee staff access.
    if (task.status !== "active" && !isSystemAdmin) {
      const userData = await Collections.userData(db).findOne({
        vaultId: new ObjectId(vaultId),
      });

      const isCommitteeStaff =
        userData?.membershipStatus === "approved" &&
        userData?.committeeMembership?.committee === task.committeeSlug &&
        ["HEAD", "COORDINATOR"].includes(
          userData?.committeeMembership?.role ?? "",
        );

      if (!isCommitteeStaff) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // ── 3. Serialize task (convert ObjectId to string) ────────────────────
    const serializedTask = {
      _id: task._id?.toString(),
      title: task.title,
      description: task.description,
      committeeSlug: task.committeeSlug,
      scope: task.scope,
      status: task.status,
      taskType: task.taskType,
      priority: task.priority,
      deadline: task.deadline.toISOString(),
      publishedAt: task.publishedAt?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      pointsReward: task.pointsReward,
      qualityWeight: task.qualityWeight,
      timeWeight: task.timeWeight,
      decayBaseHours: task.decayBaseHours,
      passThresholdPercent: task.passThresholdPercent,
      autoEvaluate: task.autoEvaluate,
      evaluationCriteria: task.evaluationCriteria,
      maxScore: task.maxScore,
      deliverables: task.deliverables,
      taskBtn: task.taskBtn ?? [],
      pollConfig: task.pollConfig,
      surveyConfig: task.surveyConfig,
      tags: task.tags,
    };

    return NextResponse.json({
      task: serializedTask,
    });
  } catch (err) {
    console.error("[GET /api/admin/tasks/task/[id]/get]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
