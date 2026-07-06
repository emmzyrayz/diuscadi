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
import { validateWeightSplit } from "@/lib/services/timeDecayService";

// ─── Weight Map ───────────────────────────────────────────────────────────────
export const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

// ── Decay defaults ────────────────────────────────────────────────────────────
// Applied when a submission task is created without explicit values.
const DEFAULT_QUALITY_WEIGHT = 80;
const DEFAULT_TIME_WEIGHT = 20;
const DEFAULT_DECAY_BASE_HOURS = 4;
const DEFAULT_PASS_THRESHOLD_PERCENT = 50;

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

  assignmentTarget?: AssignmentTarget;

  pollConfig?: PollConfig;
  surveyConfig?: SurveyConfig;

  deliverables?: TaskDeliverable[];
  maxScore?: number;
  autoEvaluate?: boolean;
  evaluationCriteria?: string;

  // ── Points + time-decay config ─────────────────────────────────────────────
  pointsReward?: number;
  qualityWeight?: number;
  timeWeight?: number;
  decayBaseHours?: number;
  passThresholdPercent?: number;

  tags?: string[];
  // "draft" | "active" | "pending_approval" — pending_approval is set by the
  // route layer (create/route.ts) based on scope + caller role, never passed
  // in directly from client input.
  status?: "draft" | "active" | "pending_approval";
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

export interface TaskInputValidationError {
  field: string;
  message: string;
}

// ─── validateTaskInput ────────────────────────────────────────────────────────
// Validates the points/decay configuration before a task is persisted.
// Only enforces the qualityWeight + timeWeight = 100 constraint when
// taskType === "submission" — other task types ignore these fields entirely.

export function validateTaskInput(
  input: Pick<CreateTaskInput, "taskType" | "qualityWeight" | "timeWeight">,
): TaskInputValidationError | null {
  if (input.taskType !== "submission") return null;

  const qualityWeight = input.qualityWeight ?? DEFAULT_QUALITY_WEIGHT;
  const timeWeight = input.timeWeight ?? DEFAULT_TIME_WEIGHT;

  const result = validateWeightSplit(qualityWeight, timeWeight);
  if (!result.valid) {
    return { field: "qualityWeight/timeWeight", message: result.error! };
  }
  return null;
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

  const assignmentTarget = resolveAssignmentTarget(input.assignmentTarget);

  const targetStatus = input.status ?? "draft";
  const isSubmission = input.taskType === "submission";

  const taskDoc: Omit<DbTask, "_id"> = {
    title: input.title,
    description: input.description,
    committeeSlug: input.committeeSlug,
    createdBy,
    scope: input.scope,
    assignmentTarget,
    taskType: input.taskType,
    pollConfig: input.pollConfig,
    surveyConfig: input.surveyConfig,
    priority: input.priority,
    priorityWeight: PRIORITY_WEIGHTS[input.priority],
    status: targetStatus,
    deadline: new Date(input.deadline),
    // publishedAt is intentionally NOT set here — it's stamped only when
    // the task actually transitions to "active" (see activateTask below
    // and the PATCH route's isActivation branch).
    deliverables: input.deliverables ?? [],
    tags: input.tags ?? [],
    maxScore: input.maxScore ?? 100,
    autoEvaluate: input.autoEvaluate ?? false,
    evaluationCriteria: input.evaluationCriteria ?? "",

    // Points config — pointsReward applies to all task types.
    // Decay fields only meaningful for submission, but harmless to store
    // defaults on other types in case the task is later edited to submission.
    pointsReward: input.pointsReward ?? 0,
    ...(isSubmission && {
      qualityWeight: input.qualityWeight ?? DEFAULT_QUALITY_WEIGHT,
      timeWeight: input.timeWeight ?? DEFAULT_TIME_WEIGHT,
      decayBaseHours: input.decayBaseHours ?? DEFAULT_DECAY_BASE_HOURS,
      passThresholdPercent:
        input.passThresholdPercent ?? DEFAULT_PASS_THRESHOLD_PERCENT,
    }),

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
    // Stamp publishedAt at the moment of immediate publish (creation-time
    // activation, e.g. committee-scope tasks created with
    // publishImmediately = true).
    await Collections.tasks(db).updateOne(
      { _id: createdTask._id },
      { $set: { publishedAt: now } },
    );
    createdTask.publishedAt = now;

    const spawnResult = await spawnAssignments(db, {
      _id: createdTask._id,
      scope: createdTask.scope,
      committeeSlug: createdTask.committeeSlug,
      assignmentTarget: createdTask.assignmentTarget,
    });
    return { task: createdTask, spawnResult };
  }

  return { task: createdTask };
}

// ─── resolveAssignmentTarget ──────────────────────────────────────────────────
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
  return {
    mode: "role",
    userIds: [],
    roles: target.roles,
  };
}

// ─── spawnAssignments ─────────────────────────────────────────────────────────
// CHANGED for Phase 3: now branches on task.scope.
//   scope === "committee" — unchanged behavior: query members of
//     committeeSlug only, filtered further by assignmentTarget mode.
//   scope === "global" — query ALL approved platform members regardless of
//     committee, filtered further by assignmentTarget mode. "role" mode for
//     a global task matches against committeeMembership.role across every
//     committee (e.g. "all HEADs platform-wide").
export async function spawnAssignments(
  db: Db,
  task: {
    _id: ObjectId;
    scope: TaskScope;
    committeeSlug: string;
    assignmentTarget: DbTask["assignmentTarget"];
  },
): Promise<SpawnResult> {
  const now = new Date();
  let targetIds: ObjectId[];

  const { assignmentTarget, scope } = task;

  if (assignmentTarget.mode === "specific") {
    // Exact list — scope is irrelevant, the named users are the targets
    // regardless of which committee they belong to.
    targetIds = assignmentTarget.userIds;
  } else if (assignmentTarget.mode === "role") {
    const roleQuery: Record<string, unknown> = {
      "committeeMembership.role": { $in: assignmentTarget.roles },
      membershipStatus: "approved",
    };
    // Committee-scoped role targeting stays locked to one committee.
    // Global-scoped role targeting matches the role across ALL committees.
    if (scope === "committee") {
      roleQuery["committeeMembership.committee"] = task.committeeSlug;
    }
    const members = await Collections.userData(db)
      .find(roleQuery, { projection: { _id: 1 } })
      .toArray();
    targetIds = members.map((m) => m._id as ObjectId);
  } else {
    // broadcast
    const broadcastQuery: Record<string, unknown> = {
      membershipStatus: "approved",
    };
    if (scope === "committee") {
      broadcastQuery["committeeMembership.committee"] = task.committeeSlug;
    }
    // scope === "global" — no committee filter at all; every approved
    // member platform-wide is a target.
    const members = await Collections.userData(db)
      .find(broadcastQuery, { projection: { _id: 1 } })
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
// Transitions draft → active, stamps publishedAt, and spawns assignments.
// Used by both the dedicated /activate route and the generic PATCH route's
// isActivation branch.
export async function activateTask(
  db: Db,
  taskId: ObjectId,
): Promise<SpawnResult> {
  const now = new Date();

  const task = await Collections.tasks(db).findOneAndUpdate(
    { _id: taskId, status: "draft" },
    { $set: { status: "active", publishedAt: now, updatedAt: now } },
    { returnDocument: "after" },
  );

  if (!task) return { spawned: 0, skipped: 0 };

  return spawnAssignments(db, {
    _id: task._id as ObjectId,
    scope: task.scope,
    committeeSlug: task.committeeSlug,
    assignmentTarget: task.assignmentTarget,
  });
}

// ─── approveGlobalTask ────────────────────────────────────────────────────────
// Transitions pending_approval → active for global tasks. Distinct from
// activateTask because the source status differs (pending_approval, not
// draft) and this is exclusively for the webmaster/head-admin approval flow.
export async function approveGlobalTask(
  db: Db,
  taskId: ObjectId,
): Promise<SpawnResult> {
  const now = new Date();

  const task = await Collections.tasks(db).findOneAndUpdate(
    { _id: taskId, status: "pending_approval", scope: "global" },
    { $set: { status: "active", publishedAt: now, updatedAt: now } },
    { returnDocument: "after" },
  );

  if (!task) return { spawned: 0, skipped: 0 };

  return spawnAssignments(db, {
    _id: task._id as ObjectId,
    scope: task.scope,
    committeeSlug: task.committeeSlug,
    assignmentTarget: task.assignmentTarget,
  });
}
