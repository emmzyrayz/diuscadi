// src/lib/services/taskService.ts

import { Db, ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import type {
  TaskPriority,
  TaskScope,
  TaskType,
  AssignmentTarget,
  PollConfig,
  SurveyConfig,
  TaskDeliverable,
} from "@/types/tasks";
import type { DbTask } from "@/lib/db/dbTypes";

// ─── Weight Map ───────────────────────────────────────────────────────────────
export const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

// ─── Input Contract ───────────────────────────────────────────────────────────
export interface CreateTaskInput {
  title: string;
  description: string;
  committeeSlug: string;
  createdBy: string | ObjectId;
  scope: TaskScope;
  taskType: TaskType;
  priority: TaskPriority;
  deadline: Date;

  // ── Replaces specificAssignees ────────────────────────────────────────────
  // Defaults to broadcast if omitted
  assignmentTarget?: AssignmentTarget;

  // ── Type-specific config ──────────────────────────────────────────────────
  pollConfig?: PollConfig;
  surveyConfig?: SurveyConfig;

  // Only relevant when taskType === "submission"
  deliverables?: TaskDeliverable[];
  maxScore?: number;
  autoEvaluate?: boolean;
  evaluationCriteria?: string;

  tags?: string[];
  status?: "draft" | "active";
}

// ─── Return Types ─────────────────────────────────────────────────────────────
export interface SpawnResult {
  spawned: number;
  skipped: number;
}

export interface CreateTaskResult {
  task: DbTask & { _id: ObjectId };
  spawnResult?: SpawnResult;
}

// ─── createTask ───────────────────────────────────────────────────────────────
export async function createTask(
  db: Db,
  input: CreateTaskInput,
): Promise<CreateTaskResult> {
  const now = new Date();

  const createdBy =
    typeof input.createdBy === "string"
      ? new ObjectId(input.createdBy)
      : input.createdBy;

  // Normalise AssignmentTarget to the flat DB shape
  const assignmentTarget = resolveAssignmentTarget(input.assignmentTarget);

  const targetStatus = input.status ?? "draft";

  const taskDoc: Omit<DbTask, "_id"> = {
    title: input.title,
    description: input.description,
    committeeSlug: input.committeeSlug,
    createdBy,
    assignmentTarget,
    scope: input.scope,
    taskType: input.taskType,
    pollConfig: input.pollConfig,
    surveyConfig: input.surveyConfig,
    priority: input.priority,
    priorityWeight: PRIORITY_WEIGHTS[input.priority],
    status: targetStatus,
    deadline: new Date(input.deadline),
    deliverables: input.deliverables ?? [],
    tags: input.tags ?? [],
    maxScore: input.maxScore ?? 100,
    autoEvaluate: input.autoEvaluate ?? false,
    evaluationCriteria: input.evaluationCriteria ?? "",
    isVisible: true,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await Collections.tasks(db).insertOne(taskDoc);
  const createdTask: DbTask & { _id: ObjectId } = {
    _id: insertResult.insertedId,
    ...taskDoc,
  };

  if (targetStatus === "active") {
    const spawnResult = await spawnAssignments(db, {
      _id: createdTask._id,
      committeeSlug: createdTask.committeeSlug,
      assignmentTarget: createdTask.assignmentTarget,
    });
    return { task: createdTask, spawnResult };
  }

  return { task: createdTask };
}

// ─── resolveAssignmentTarget ──────────────────────────────────────────────────
// Converts the discriminated union from CreateTaskInput into the flat DB shape.
// Both arrays are always present; mode determines which one is meaningful.
export function resolveAssignmentTarget(
  target?: AssignmentTarget,
): DbTask["assignmentTarget"] {
  if (!target || target.mode === "broadcast") {
    return { mode: "broadcast", userIds: [], roles: [] };
  }
  if (target.mode === "specific") {
    return {
      mode: "specific",
      userIds: target.userIds.map((id) => new ObjectId(id)),
      roles: [],
    };
  }
  // mode === "role"
  return {
    mode: "role",
    userIds: [],
    roles: target.roles,
  };
}

// ─── spawnAssignments ─────────────────────────────────────────────────────────
export async function spawnAssignments(
  db: Db,
  task: {
    _id: ObjectId;
    committeeSlug: string;
    assignmentTarget: DbTask["assignmentTarget"];
  },
): Promise<SpawnResult> {
  const now = new Date();
  let targetIds: ObjectId[];

  const { assignmentTarget } = task;

  if (assignmentTarget.mode === "specific") {
    // Exact list of user IDs — already ObjectIds from resolveAssignmentTarget
    targetIds = assignmentTarget.userIds;
  } else if (assignmentTarget.mode === "role") {
    // Query only members whose committee role matches
    const members = await Collections.userData(db)
      .find(
        {
          "committeeMembership.committee": task.committeeSlug,
          "committeeMembership.role": { $in: assignmentTarget.roles },
          membershipStatus: "approved",
        },
        { projection: { _id: 1 } },
      )
      .toArray();
    targetIds = members.map((m) => m._id as ObjectId);
  } else {
    // broadcast — all approved members of the committee
    const members = await Collections.userData(db)
      .find(
        {
          "committeeMembership.committee": task.committeeSlug,
          membershipStatus: "approved",
        },
        { projection: { _id: 1 } },
      )
      .toArray();
    targetIds = members.map((m) => m._id as ObjectId);
  }

  if (targetIds.length === 0) return { spawned: 0, skipped: 0 };

  const docs = targetIds.map((userId) => ({
    taskId: task._id,
    userId,
    committeeSlug: task.committeeSlug,
    status: "pending" as const,
    revisionHistory: [] as never[],
    overriddenDeadline: null,
    createdAt: now,
    updatedAt: now,
  }));

  try {
    const result = await Collections.assignments(db).insertMany(docs, {
      ordered: false,
    });
    return {
      spawned: result.insertedCount,
      skipped: docs.length - result.insertedCount,
    };
  } catch (err: unknown) {
    const e = err as { code?: number; result?: { insertedCount?: number } };
    if (e?.code === 11000 || e?.result) {
      const inserted = e.result?.insertedCount ?? 0;
      return { spawned: inserted, skipped: docs.length - inserted };
    }
    throw err;
  }
}

// ─── activateTask ─────────────────────────────────────────────────────────────
export async function activateTask(
  db: Db,
  taskId: ObjectId,
): Promise<SpawnResult> {
  const now = new Date();

  const task = await Collections.tasks(db).findOneAndUpdate(
    { _id: taskId, status: "draft" },
    { $set: { status: "active", updatedAt: now } },
    { returnDocument: "after" },
  );

  if (!task) return { spawned: 0, skipped: 0 };

  return spawnAssignments(db, {
    _id: task._id as ObjectId,
    committeeSlug: task.committeeSlug,
    assignmentTarget: task.assignmentTarget,
  });
}
