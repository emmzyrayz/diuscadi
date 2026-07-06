// src/lib/db/migrations/001_referral_migration.ts
// ─────────────────────────────────────────────────────────────────────────────
// ONE-TIME migration: transfers data from the old ReferralLink / ReferralEvent
// system into the new unified referral model before those collections are dropped.
//
// What this script does:
//   1. Archives both old collections into _referralLinksArchive and
//      _referralEventsArchive (safe rollback point — never deletes originals).
//   2. For each old ReferralEvent where eventType === "register":
//        a. Resolves the actor (actorVaultId) → their UserData document.
//        b. Resolves the owner (ownerVaultId) → their UserData document +
//           signupInviteCode.
//        c. If the actor's UserData has no referredBy set, sets it to the
//           owner's signupInviteCode.
//        d. Walks UP the referral chain (depth 2, depth 3) to credit indirect
//           rewards to ancestors, stopping at referralMaxDepth.
//   3. For each reward credited, writes a PointsLog entry and $inc the
//      recipient's points.current, points.lifetime, and referralMeta counters.
//   4. Handles legacy referredBy: ObjectId values — resolves them to the
//      corresponding signupInviteCode string and rewrites the field.
//   5. Produces a report: how many referredBy fields set, how many PointsLog
//      entries written, how many skipped (already had referredBy), errors.
//
// Run ONCE before dropping referralLinks and referralEvents:
//   pnpm dotenv -e .env.local -- tsx src/lib/db/migrations/001_referral_migration.ts
//
// Safe to re-run — all writes are guarded by existence checks. Running twice
// will produce a "skipped" report for everything already migrated.
// ─────────────────────────────────────────────────────────────────────────────

import { getDb } from "@/lib/mongodb";
import { ObjectId, WithId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import type { UserDataDocument } from "@/lib/models/UserData";
import type { PointsLogDocument } from "@/lib/models/PointsLog";

// ── Config ────────────────────────────────────────────────────────────────────
// Mirror the defaults from PLATFORM_CONFIG_DEFAULTS so this script is
// self-contained and doesn't depend on the DB having config seeded yet.
const DEPTH_REWARDS: Record<number, number> = {
  1: 50, // direct referral — override from platformConfig if present
  2: 25, // indirect depth 2
  3: 10, // indirect depth 3
};
const MAX_DEPTH = 3;

// ── Types for old collections ─────────────────────────────────────────────────

interface OldReferralEventDocument {
  _id?: ObjectId;
  code: string;
  ownerVaultId: ObjectId;
  actorVaultId?: ObjectId;
  eventType: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface OldReferralLinkDocument {
  _id?: ObjectId;
  code: string;
  ownerVaultId: ObjectId;
  resourceType: string;
  resourceId: string;
  path: string;
  title?: string;
  parentCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Report ────────────────────────────────────────────────────────────────────

interface MigrationReport {
  totalReferralEvents: number;
  registrationEvents: number;
  referredBySet: number;
  referredByAlreadySet: number;
  referredByActorNotFound: number;
  referredByOwnerNotFound: number;
  pointsLogEntriesWritten: number;
  retroactiveDepth2Credits: number;
  retroactiveDepth3Credits: number;
  legacyObjectIdReferredByFixed: number;
  errors: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolvePointsRewardConfig(
  db: Awaited<ReturnType<typeof getDb>>,
) {
  // Attempt to read live config from DB; fall back to defaults above.
  try {
    const configs = await db
      .collection("platformConfig")
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

    const map: Record<string, number> = {};
    for (const c of configs) {
      map[c.key as string] = c.value as number;
    }

    return {
      depth1: map["referralBonusPoints"] ?? DEPTH_REWARDS[1],
      depth2: map["referralDepth2BonusPoints"] ?? DEPTH_REWARDS[2],
      depth3: map["referralDepth3BonusPoints"] ?? DEPTH_REWARDS[3],
      maxDepth: map["referralMaxDepth"] ?? MAX_DEPTH,
    };
  } catch {
    return {
      depth1: DEPTH_REWARDS[1],
      depth2: DEPTH_REWARDS[2],
      depth3: DEPTH_REWARDS[3],
      maxDepth: MAX_DEPTH,
    };
  }
}

// Credit points to a user and write an immutable PointsLog entry.
// Guards against double-crediting by checking for an existing PointsLog entry
// with the same userId + refereeUserId + referralDepth combination.
async function creditReferralPoints(
  db: Awaited<ReturnType<typeof getDb>>,
  opts: {
    userId: ObjectId; // the user receiving the reward
    refereeUserId: ObjectId; // the new user who triggered the reward
    referralDepth: 1 | 2 | 3;
    amount: number;
    sourceId: string; // referee's userData._id as string
    createdAt: Date;
  },
): Promise<"credited" | "already_credited" | "skipped_zero"> {
  if (opts.amount <= 0) return "skipped_zero";

  // Idempotency guard — don't double-credit for the same referee+depth.
  const existing = await db.collection("pointsLog").findOne({
    userId: opts.userId,
    refereeUserId: opts.refereeUserId,
    referralDepth: opts.referralDepth,
    source: { $in: ["referral_signup", "referral_event_reg"] },
  });
  if (existing) return "already_credited";

  // Atomically increment points and read the new lifetime total.
  const updateResult = await Collections.userData(db).findOneAndUpdate(
    { _id: opts.userId },
    {
      $inc: {
        "points.current": opts.amount,
        "points.lifetime": opts.amount,
        ...(opts.referralDepth === 1
          ? {
              "referralMeta.directCount": 1,
              "referralMeta.totalEarned": opts.amount,
            }
          : {
              "referralMeta.indirectCount": 1,
              "referralMeta.totalEarned": opts.amount,
            }),
        ...(opts.referralDepth > (1 as number) ? {} : {}),
      },
      $set: {
        "referralMeta.lastReferralAt": opts.createdAt,
        // treeDepthReached: keep the maximum depth seen so far.
        // We can't do a conditional $max in a single update without
        // aggregation pipeline update syntax — use $max operator.
      },
      $max: {
        "referralMeta.treeDepthReached": opts.referralDepth,
      },
      $setOnInsert: {
        "points.current": opts.amount,
        "points.lifetime": opts.amount,
      },
    },
    { returnDocument: "after", upsert: false },
  );

  if (!updateResult) return "skipped_zero";

  const lifetimeAfter =
    (updateResult as WithId<UserDataDocument>).points?.lifetime ?? opts.amount;

  const logEntry: Omit<PointsLogDocument, "_id"> = {
    userId: opts.userId,
    amount: opts.amount,
    lifetimeAfter,
    source: "referral_signup",
    sourceId: opts.sourceId,
    refereeUserId: opts.refereeUserId,
    referralDepth: opts.referralDepth,
    createdAt: opts.createdAt,
  };

  await db.collection("pointsLog").insertOne(logEntry);
  return "credited";
}

// ── Main migration ────────────────────────────────────────────────────────────

async function runMigration(): Promise<void> {
  const db = await getDb();
  const report: MigrationReport = {
    totalReferralEvents: 0,
    registrationEvents: 0,
    referredBySet: 0,
    referredByAlreadySet: 0,
    referredByActorNotFound: 0,
    referredByOwnerNotFound: 0,
    pointsLogEntriesWritten: 0,
    retroactiveDepth2Credits: 0,
    retroactiveDepth3Credits: 0,
    legacyObjectIdReferredByFixed: 0,
    errors: [],
  };

  const rewardConfig = await resolvePointsRewardConfig(db);

  // ── Step 0: Fix legacy referredBy: ObjectId fields ────────────────────────
  // The old schema stored referredBy as ObjectId (vaultId of referrer).
  // The new schema stores the referrer's signupInviteCode string.
  // Find all UserData where referredBy is an ObjectId and convert it.
  console.log("Step 0: fixing legacy referredBy ObjectId values...");

  const legacyReferredBy = await Collections.userData(db)
    .find({ referredBy: { $type: "objectId" } })
    .toArray();

  for (const user of legacyReferredBy) {
    try {
      const referrerVaultId = user.referredBy as unknown as ObjectId;
      const referrerUserData = await Collections.userData(db).findOne(
        { vaultId: referrerVaultId },
        { projection: { signupInviteCode: 1 } },
      );
      if (!referrerUserData?.signupInviteCode) {
        report.errors.push(
          `Legacy referredBy fix: no userData for vaultId ${referrerVaultId} (user ${user._id})`,
        );
        continue;
      }
      await Collections.userData(db).updateOne(
        { _id: user._id },
        { $set: { referredBy: referrerUserData.signupInviteCode } },
      );
      report.legacyObjectIdReferredByFixed++;
    } catch (err) {
      report.errors.push(
        `Legacy referredBy fix error for user ${user._id}: ${err}`,
      );
    }
  }
  console.log(
    `  Fixed ${report.legacyObjectIdReferredByFixed} legacy ObjectId referredBy values.`,
  );

  // ── Step 1: Archive old collections ──────────────────────────────────────
  // Copy both collections into archive collections before any destructive work.
  console.log("Step 1: archiving old referralLinks and referralEvents...");

  const [oldLinks, oldEvents] = await Promise.all([
    db.collection<OldReferralLinkDocument>("referralLinks").find({}).toArray(),
    db
      .collection<OldReferralEventDocument>("referralEvents")
      .find({})
      .toArray(),
  ]);

  report.totalReferralEvents = oldEvents.length;

  if (oldLinks.length > 0) {
    await db
      .collection("_referralLinksArchive")
      .insertMany(
        oldLinks.map((l) => ({ ...l, _archivedAt: new Date() })),
        { ordered: false },
      )
      .catch((err) => {
        // insertMany with ordered: false throws on duplicates but still inserts
        // the non-duplicate documents. Log and continue.
        console.log(
          `  Archive links: ${err.message} (some may already be archived)`,
        );
      });
  }
  if (oldEvents.length > 0) {
    await db
      .collection("_referralEventsArchive")
      .insertMany(
        oldEvents.map((e) => ({ ...e, _archivedAt: new Date() })),
        { ordered: false },
      )
      .catch((err) => {
        console.log(
          `  Archive events: ${err.message} (some may already be archived)`,
        );
      });
  }

  console.log(
    `  Archived ${oldLinks.length} links, ${oldEvents.length} events.`,
  );

  // ── Step 2: Process "register" events ─────────────────────────────────────
  // Each register event represents a user signing up via a referral code.
  // We use this to reconstruct the referredBy chain.
  console.log("Step 2: processing registration referral events...");

  const registerEvents = oldEvents.filter((e) => e.eventType === "register");
  report.registrationEvents = registerEvents.length;

  for (const event of registerEvents) {
    try {
      if (!event.actorVaultId) continue;

      // Resolve actor (the user who registered via the referral code)
      const actorUserData = await Collections.userData(db).findOne(
        { vaultId: event.actorVaultId },
        { projection: { _id: 1, referredBy: 1, signupInviteCode: 1 } },
      );
      if (!actorUserData) {
        report.referredByActorNotFound++;
        continue;
      }

      // Resolve owner (the referrer)
      const ownerUserData = await Collections.userData(db).findOne(
        { vaultId: event.ownerVaultId },
        { projection: { _id: 1, signupInviteCode: 1, referredBy: 1 } },
      );
      if (!ownerUserData?.signupInviteCode) {
        report.referredByOwnerNotFound++;
        continue;
      }

      // Set referredBy on the actor if not already set
      if (!actorUserData.referredBy) {
        await Collections.userData(db).updateOne(
          { _id: actorUserData._id },
          { $set: { referredBy: ownerUserData.signupInviteCode } },
        );
        report.referredBySet++;
      } else {
        report.referredByAlreadySet++;
      }

      const actorIdStr = (actorUserData._id as ObjectId).toString();
      const eventDate = event.createdAt ?? new Date();

      // ── Credit depth-1 reward to direct referrer ─────────────────────────
      const depth1Result = await creditReferralPoints(db, {
        userId: ownerUserData._id as ObjectId,
        refereeUserId: actorUserData._id as ObjectId,
        referralDepth: 1,
        amount: rewardConfig.depth1,
        sourceId: actorIdStr,
        createdAt: eventDate,
      });
      if (depth1Result === "credited") report.pointsLogEntriesWritten++;

      // ── Walk up the chain for indirect rewards ───────────────────────────
      if (rewardConfig.maxDepth >= 2 && ownerUserData.referredBy) {
        // Depth 2: the owner's referrer
        const depth2Referrer = await Collections.userData(db).findOne(
          { signupInviteCode: ownerUserData.referredBy },
          { projection: { _id: 1, referredBy: 1 } },
        );
        if (depth2Referrer && rewardConfig.depth2 > 0) {
          const d2Result = await creditReferralPoints(db, {
            userId: depth2Referrer._id as ObjectId,
            refereeUserId: actorUserData._id as ObjectId,
            referralDepth: 2,
            amount: rewardConfig.depth2,
            sourceId: actorIdStr,
            createdAt: eventDate,
          });
          if (d2Result === "credited") {
            report.pointsLogEntriesWritten++;
            report.retroactiveDepth2Credits++;
          }

          // Depth 3: the depth-2 referrer's referrer
          if (rewardConfig.maxDepth >= 3 && depth2Referrer.referredBy) {
            const depth3Referrer = await Collections.userData(db).findOne(
              { signupInviteCode: depth2Referrer.referredBy as string },
              { projection: { _id: 1 } },
            );
            if (depth3Referrer && rewardConfig.depth3 > 0) {
              const d3Result = await creditReferralPoints(db, {
                userId: depth3Referrer._id as ObjectId,
                refereeUserId: actorUserData._id as ObjectId,
                referralDepth: 3,
                amount: rewardConfig.depth3,
                sourceId: actorIdStr,
                createdAt: eventDate,
              });
              if (d3Result === "credited") {
                report.pointsLogEntriesWritten++;
                report.retroactiveDepth3Credits++;
              }
            }
          }
        }
      }
    } catch (err) {
      report.errors.push(`Event ${event._id}: ${err}`);
    }
  }

  // ── Step 3: Seed zero points for users who have none ──────────────────────
  // Ensures every existing user has the points sub-document present so
  // future $inc operations don't fail on missing paths.
  console.log("Step 3: seeding zero points for users without points field...");

  const seedResult = await Collections.userData(db).updateMany(
    { points: { $exists: false } },
    {
      $set: {
        "points.current": 0,
        "points.lifetime": 0,
      },
    },
  );
  console.log(
    `  Seeded points sub-document for ${seedResult.modifiedCount} users.`,
  );

  // ── Step 4: Seed zero referralMeta for all users ──────────────────────────
  console.log("Step 4: seeding referralMeta for users without it...");

  const metaResult = await Collections.userData(db).updateMany(
    { referralMeta: { $exists: false } },
    {
      $set: {
        "referralMeta.directCount": 0,
        "referralMeta.indirectCount": 0,
        "referralMeta.totalEarned": 0,
        "referralMeta.treeDepthReached": 0,
      },
    },
  );
  console.log(`  Seeded referralMeta for ${metaResult.modifiedCount} users.`);

  // ── Report ────────────────────────────────────────────────────────────────
  console.log("\n✅ Migration complete.\n");
  console.log("─── Report ──────────────────────────────────────────────────");
  console.log(
    `  Legacy ObjectId referredBy values fixed : ${report.legacyObjectIdReferredByFixed}`,
  );
  console.log(
    `  Total referral events in old system     : ${report.totalReferralEvents}`,
  );
  console.log(
    `  Registration events processed           : ${report.registrationEvents}`,
  );
  console.log(
    `  referredBy field newly set              : ${report.referredBySet}`,
  );
  console.log(
    `  referredBy already set (skipped)        : ${report.referredByAlreadySet}`,
  );
  console.log(
    `  Actor userData not found (skipped)      : ${report.referredByActorNotFound}`,
  );
  console.log(
    `  Owner userData not found (skipped)      : ${report.referredByOwnerNotFound}`,
  );
  console.log(
    `  PointsLog entries written               : ${report.pointsLogEntriesWritten}`,
  );
  console.log(
    `    Depth-2 indirect credits              : ${report.retroactiveDepth2Credits}`,
  );
  console.log(
    `    Depth-3 indirect credits              : ${report.retroactiveDepth3Credits}`,
  );
  console.log(
    `  Errors                                  : ${report.errors.length}`,
  );
  if (report.errors.length > 0) {
    console.log("\n  Error details:");
    report.errors.forEach((e) => console.log(`    • ${e}`));
  }
  console.log("────────────────────────────────────────────────────────────");
  console.log("\nNext steps:");
  console.log(
    "  1. Review the report above — confirm 0 errors (or investigate any listed).",
  );
  console.log(
    "  2. Verify _referralLinksArchive and _referralEventsArchive collections in MongoDB Atlas.",
  );
  console.log(
    "  3. Only after confirming: drop the referralLinks and referralEvents collections.",
  );
  console.log(
    "  4. Remove ReferralLink.ts, ReferralEvent.ts, and the three old referral API routes.",
  );
  console.log("  5. Run indexes.ts to create the new pointsLog indexes.\n");
}

// ── Entry point ───────────────────────────────────────────────────────────────

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

export { runMigration };
