// scripts/fix-orphaned-guest-migrations.ts
//
// Run manually: npx tsx scripts/fix-orphaned-guest-migrations.ts [--dry-run]
//
// Finds guestEventRegistrations that are STILL counted as active
// (migratedToUserId missing) even though the owning guestProfile has
// already been migrated to a real account — the double-counting bug from
// the migrate-guest race. For each one, checks whether the corresponding
// eventRegistrations doc already exists for that account/event pair.
//
//   - If it exists: the seat truly is double-counted. Safe to stamp
//     migratedToUserId on the guest doc — this doesn't touch registration
//     data, just corrects the capacity count.
//   - If it does NOT exist: the migration failed to create the account-side
//     registration at all. This is a LOST seat, not a double-count, and
//     needs manual review — the script will only report these, not fix them
//     automatically, since blindly inserting could race with a fresh
//     registration or violate a ticket-tier that's since sold out for real.

import { getDb } from "../src/lib/mongodb";
import { Collections } from "../src/lib/db/collections";
import { ObjectId } from "mongodb";

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const db = await getDb();

  const migratedProfiles = await Collections.guestProfiles(db)
    .find({ migratedToUserId: { $exists: true } })
    .project({ _id: 1, migratedToUserId: 1, email: 1 })
    .toArray();

  console.log(`Found ${migratedProfiles.length} migrated guest profiles.`);

  let doubleCounted = 0;
  let lostSeats = 0;
  let alreadyClean = 0;

  for (const profile of migratedProfiles) {
    const orphanedRegs = await Collections.guestEventRegistrations(db)
      .find({
        guestProfileId: profile._id,
        migratedToUserId: { $exists: false },
        status: { $ne: "cancelled" },
      })
      .toArray();

    if (orphanedRegs.length === 0) {
      alreadyClean++;
      continue;
    }

    for (const reg of orphanedRegs) {
      const accountReg = await Collections.eventRegistrations(db).findOne({
        userId: profile.migratedToUserId as ObjectId,
        eventId: reg.eventId,
      });

      if (accountReg) {
        doubleCounted++;
        console.log(
          `[DOUBLE-COUNT] guest=${profile.email} guestRegId=${reg._id} eventId=${reg.eventId} -> stamping migratedToUserId`,
        );
        if (!DRY_RUN) {
          await Collections.guestEventRegistrations(db).updateOne(
            { _id: reg._id },
            {
              $set: {
                migratedToUserId: profile.migratedToUserId,
                migratedAt: new Date(),
                updatedAt: new Date(),
              },
            },
          );
        }
      } else {
        lostSeats++;
        console.log(
          `[LOST-SEAT / NEEDS REVIEW] guest=${profile.email} guestRegId=${reg._id} eventId=${reg.eventId} -> no matching eventRegistrations doc; NOT auto-fixed`,
        );
      }
    }
  }

  console.log("\n── Summary ──────────────────────────────");
  console.log(`Already clean profiles: ${alreadyClean}`);
  console.log(
    `Double-counted (fixed${DRY_RUN ? ", dry-run" : ""}): ${doubleCounted}`,
  );
  console.log(`Lost seats needing manual review: ${lostSeats}`);
  if (DRY_RUN)
    console.log(
      "\nDry run only — no writes were made. Re-run without --dry-run to apply fixes.",
    );

  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
