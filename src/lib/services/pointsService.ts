// src/lib/services/pointsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// The ONLY place in the codebase that writes to pointsLog or mutates
// UserData.points. All other routes call these functions — they never
// write points directly.
//
// Design rules enforced here:
//   • pointsLog is append-only — no updates, no deletes.
//   • Every credit is guarded against double-writing via an idempotency key
//     (userId + source + sourceId combination checked before insert).
//   • UserData.points and UserData.referralMeta are always updated in the
//     same atomic findOneAndUpdate as the PointsLog insert — they are never
//     updated separately.
//   • lifetimeAfter is snapshotted from the result of the findOneAndUpdate
//     so the log entry reflects the true post-transaction balance.
// ─────────────────────────────────────────────────────────────────────────────

import { Db, ObjectId, WithId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import type {
  PointsLogDocument,
  PointsLogSource,
} from "@/lib/models/PointsLog";
import type { UserDataDocument } from "@/lib/models/UserData";

// ─── Shared input types ───────────────────────────────────────────────────────

export interface CreditReferralPointsInput {
  db: Db;
  // The user receiving the reward (the referrer, or their ancestor).
  recipientUserId: ObjectId;
  // The user whose signup/registration triggered this reward.
  refereeUserId: ObjectId;
  // 1 = direct, 2 = indirect depth-2, 3 = indirect depth-3.
  depth: 1 | 2 | 3;
  // Points to credit. Pass 0 to no-op cleanly.
  amount: number;
  // "referral_signup" or "referral_event_reg"
  source: Extract<PointsLogSource, "referral_signup" | "referral_event_reg">;
  // ISO timestamp of the original referral event (used for createdAt on the log).
  eventDate?: Date;
}

export interface CreditTaskPointsInput {
  db: Db;
  userId: ObjectId;
  assignmentId: ObjectId;
  taskId: ObjectId;
  taskTitle: string;
  amount: number;
  source: Extract<
    PointsLogSource,
    | "task_completion"
    | "task_poll"
    | "task_survey"
    | "task_acknowledgement"
    | "task_learning"
  >;
  // Only for task_completion (submission tasks with a score).
  taskScore?: number;
  taskMaxScore?: number;
}

export interface AdminAdjustPointsInput {
  db: Db;
  userId: ObjectId;
  // Positive = grant, negative = deduct.
  amount: number;
  grantedBy: ObjectId;
  reason: string;
}

// ─── Return type ──────────────────────────────────────────────────────────────

export type CreditResult =
  | { ok: true; logId: ObjectId; lifetimeAfter: number }
  | {
      ok: false;
      reason: "already_credited" | "zero_amount" | "user_not_found";
    };

// ─── Internal idempotency check ───────────────────────────────────────────────
// Returns true if a log entry already exists for this exact combination,
// meaning the reward was already credited and we must not double-write.

async function isAlreadyCredited(
  db: Db,
  filter: Partial<PointsLogDocument>,
): Promise<boolean> {
  const existing = await db
    .collection("pointsLog")
    .findOne(filter, { projection: { _id: 1 } });
  return !!existing;
}

// ─── Internal write helper ────────────────────────────────────────────────────
// Atomically increments UserData.points and writes the PointsLog entry.
// Returns the log document's inserted _id and the new lifetime balance.

async function writePointsTransaction(
  db: Db,
  userId: ObjectId,
  amount: number,
  logEntry: Omit<
    PointsLogDocument,
    "_id" | "userId" | "amount" | "lifetimeAfter" | "createdAt"
  >,
): Promise<{ logId: ObjectId; lifetimeAfter: number } | null> {
  const now = new Date();

  // Atomically increment points on the UserData document.
  const updated = await Collections.userData(db).findOneAndUpdate(
    { _id: userId },
    {
      $inc: {
        "points.current": amount,
        "points.lifetime": amount,
      },
      $set: { "points.lastCreditedAt": now },
    },
    { returnDocument: "after" },
  );

  if (!updated) return null;

  const lifetimeAfter =
    (updated as WithId<UserDataDocument>).points?.lifetime ?? amount;

  // Write the immutable log entry.
  const fullEntry: Omit<PointsLogDocument, "_id"> = {
    userId,
    amount,
    lifetimeAfter,
    createdAt: now,
    ...logEntry,
  };

  const { insertedId } = await db
    .collection<PointsLogDocument>("pointsLog")
    .insertOne(fullEntry as PointsLogDocument);

  return { logId: insertedId, lifetimeAfter };
}

// ─── creditReferralPoints ─────────────────────────────────────────────────────
// Called by the signup route (depth-1, and walking the chain for depth-2/3)
// and by the event registration route for referral_event_reg rewards.
// Also called by the migration script for retroactive credits.

export async function creditReferralPoints(
  input: CreditReferralPointsInput,
): Promise<CreditResult> {
  const {
    db,
    recipientUserId,
    refereeUserId,
    depth,
    amount,
    source,
    eventDate,
  } = input;

  if (amount <= 0) return { ok: false, reason: "zero_amount" };

  // Idempotency: one reward per recipient per referee per depth per source.
  const alreadyDone = await isAlreadyCredited(db, {
    userId: recipientUserId,
    refereeUserId,
    referralDepth: depth,
    source,
  });
  if (alreadyDone) return { ok: false, reason: "already_credited" };

  // Update referralMeta counters alongside the points increment.
  const metaInc =
    depth === 1
      ? {
          "referralMeta.directCount": 1,
          "referralMeta.totalEarned": amount,
        }
      : {
          "referralMeta.indirectCount": 1,
          "referralMeta.totalEarned": amount,
        };

  const now = eventDate ?? new Date();

  const updated = await Collections.userData(db).findOneAndUpdate(
    { _id: recipientUserId },
    {
      $inc: {
        "points.current": amount,
        "points.lifetime": amount,
        ...metaInc,
      },
      $set: {
        "points.lastCreditedAt": now,
        "referralMeta.lastReferralAt": now,
      },
      $max: {
        "referralMeta.treeDepthReached": depth,
      },
    },
    { returnDocument: "after" },
  );

  if (!updated) return { ok: false, reason: "user_not_found" };

  const lifetimeAfter =
    (updated as WithId<UserDataDocument>).points?.lifetime ?? amount;

  const logEntry: Omit<PointsLogDocument, "_id"> = {
    userId: recipientUserId,
    amount,
    lifetimeAfter,
    source,
    sourceId: refereeUserId.toString(),
    refereeUserId,
    referralDepth: depth,
    createdAt: now,
  };

  const { insertedId } = await db
    .collection<PointsLogDocument>("pointsLog")
    .insertOne(logEntry as PointsLogDocument);

  return { ok: true, logId: insertedId, lifetimeAfter };
}

// ─── processReferralChain ─────────────────────────────────────────────────────
// The main entry point called after a new user signs up or an event
// registration with a referral code is confirmed.
//
// Given the new user's userData._id:
//   1. Reads their referredBy code.
//   2. Looks up the referrer (depth-1) and credits depth-1 reward.
//   3. Walks up to depth-2 and depth-3, crediting accordingly.
//   4. Reads reward amounts and maxDepth from platformConfig (falls back
//      to hardcoded defaults if config is missing).
//
// Fire-and-forget safe: all errors are caught and logged, never thrown,
// so a rewards failure never surfaces to the registering user.

export async function processReferralChain(
  db: Db,
  opts: {
    newUserId: ObjectId; // the person who just signed up
    source: Extract<PointsLogSource, "referral_signup" | "referral_event_reg">;
    eventDate?: Date;
  },
): Promise<void> {
  try {
    // Load reward config from platformConfig (or use defaults).
    const configDocs = await Collections.platformConfig(db)
      .find({
        key: {
          $in: [
            "referralBonusPoints",
            "referralDepth2BonusPoints",
            "referralDepth3BonusPoints",
            "referralMaxDepth",
          ],
        },
      })
      .toArray();

    const cfg: Record<string, number> = {};
    for (const c of configDocs) cfg[c.key as string] = c.value as number;

    const rewards: Record<1 | 2 | 3, number> = {
      1: cfg["referralBonusPoints"] ?? 50,
      2: cfg["referralDepth2BonusPoints"] ?? 25,
      3: cfg["referralDepth3BonusPoints"] ?? 10,
    };
    const maxDepth: number = cfg["referralMaxDepth"] ?? 3;

    // Load the new user to get their referredBy code.
    const newUser = await Collections.userData(db).findOne(
      { _id: opts.newUserId },
      { projection: { referredBy: 1 } },
    );
    if (!newUser?.referredBy) return; // organic signup — no referral chain

    // Walk the chain up to maxDepth.
    let currentCode: string | null | undefined = newUser.referredBy;
    let currentDepth = 1;

    while (currentCode && currentDepth <= maxDepth) {
      const ancestor = await Collections.userData(db).findOne(
        { signupInviteCode: currentCode },
        { projection: { _id: 1, referredBy: 1 } },
      );
      if (!ancestor) break;

      const depth = currentDepth as 1 | 2 | 3;
      const amount = rewards[depth] ?? 0;

      if (amount > 0) {
        await creditReferralPoints({
          db,
          recipientUserId: ancestor._id as ObjectId,
          refereeUserId: opts.newUserId,
          depth,
          amount,
          source: opts.source,
          eventDate: opts.eventDate,
        });
      }

      // Move up the chain.
      currentCode = ancestor.referredBy as string | null | undefined;
      currentDepth++;
    }
  } catch (err) {
    // Never throw — rewards failure must not block registration.
    console.error("[processReferralChain] Error (non-fatal):", err);
  }
}

// ─── creditTaskPoints ─────────────────────────────────────────────────────────
// Called by the assignment submit/evaluate routes when a task is completed.
// Phase 2: scaffold only for now — fully wired in Phase 3.

export async function creditTaskPoints(
  input: CreditTaskPointsInput,
): Promise<CreditResult> {
  const {
    db,
    userId,
    assignmentId,
    taskId,
    taskTitle,
    amount,
    source,
    taskScore,
    taskMaxScore,
  } = input;

  if (amount <= 0) return { ok: false, reason: "zero_amount" };

  // Idempotency: one reward per assignment.
  const alreadyDone = await isAlreadyCredited(db, {
    userId,
    source,
    sourceId: assignmentId.toString(),
  });
  if (alreadyDone) return { ok: false, reason: "already_credited" };

  const result = await writePointsTransaction(db, userId, amount, {
    source,
    sourceId: assignmentId.toString(),
    taskId,
    taskTitle,
    ...(taskScore !== undefined && { taskScore }),
    ...(taskMaxScore !== undefined && { taskMaxScore }),
  });

  if (!result) return { ok: false, reason: "user_not_found" };
  return { ok: true, ...result };
}

// ─── adminAdjustPoints ────────────────────────────────────────────────────────
// Manual grant or deduction by an admin. Amount is signed:
//   positive = grant, negative = deduction.
// No idempotency guard — admin actions are intentionally repeatable.

export async function adminAdjustPoints(
  input: AdminAdjustPointsInput,
): Promise<CreditResult> {
  const { db, userId, amount, grantedBy, reason } = input;

  if (amount === 0) return { ok: false, reason: "zero_amount" };

  const source: PointsLogSource = amount > 0 ? "admin_grant" : "admin_deduct";

  const result = await writePointsTransaction(db, userId, amount, {
    source,
    sourceId: "manual",
    grantedBy,
    reason,
  });

  if (!result) return { ok: false, reason: "user_not_found" };
  return { ok: true, ...result };
}
