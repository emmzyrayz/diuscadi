// scripts/full-system-check.ts
//
// Run: npx tsx --env-file=.env.local scripts/full-system-check.ts
//
// Checks, across EVERY event in the database (not just one), the three
// classes of bugs fixed in this session:
//
//   1. Tier capacity sanity — sum(ticketType.maxQuantity) vs event.capacity,
//      and actual registered counts vs each tier's maxQuantity (the
//      LASCADSS-style bug: a tier silently capping below what the event
//      capacity implies).
//   2. Orphaned guest migrations — same check as
//      fix-orphaned-guest-migrations.ts, but re-run as a standing
//      regression check now that the transaction fix is live.
//   3. registrationClosed data integrity — every event has the field set
//      (not undefined), and closed events have consistent audit metadata
//      (registrationClosedAt/By set iff registrationClosed is true).
//
// This is READ-ONLY. It reports; it does not fix anything.

import { getDb } from "../src/lib/mongodb";
import { Collections } from "../src/lib/db/collections";

async function main() {
  const db = await getDb();
  let issues = 0;

  console.log("═══════════════════════════════════════════════════");
  console.log("1. TIER CAPACITY SANITY CHECK");
  console.log("═══════════════════════════════════════════════════\n");

  const events = await Collections.events(db)
    .find({ status: { $ne: "cancelled" } })
    .toArray();

  for (const event of events) {
    const tiers = await Collections.ticketTypes(db)
      .find({ eventId: event._id })
      .toArray();

    const sumMaxQuantity = tiers.reduce((sum, t) => sum + (t.maxQuantity ?? 0), 0);

    if (sumMaxQuantity < event.capacity) {
      issues++;
      console.log(
        `⚠ "${event.title}" (${event.slug}): sum(tier.maxQuantity)=${sumMaxQuantity} ` +
          `< event.capacity=${event.capacity} — ${event.capacity - sumMaxQuantity} seats ` +
          `unreachable by any tier`,
      );
    }

    for (const tier of tiers) {
      const [accountCount, guestCount] = await Promise.all([
        Collections.eventRegistrations(db).countDocuments({
          eventId: event._id,
          ticketTypeId: tier._id,
          status: { $ne: "cancelled" },
        }),
        Collections.guestEventRegistrations(db).countDocuments({
          eventId: event._id,
          ticketTypeId: tier._id,
          status: { $ne: "cancelled" },
          verifiedAt: { $exists: true },
          migratedToUserId: { $exists: false },
        }),
      ]);
      const total = accountCount + guestCount;

      if (total > tier.maxQuantity) {
        issues++;
        console.log(
          `⚠ "${event.title}" / tier "${tier.name}": ${total} registered ` +
            `> maxQuantity=${tier.maxQuantity} — tier is OVERSOLD by ${total - tier.maxQuantity}`,
        );
      }
    }
  }

  console.log(
    `\n${events.length} active events checked. See warnings above (if any).\n`,
  );

  console.log("═══════════════════════════════════════════════════");
  console.log("2. ORPHANED GUEST MIGRATION CHECK");
  console.log("═══════════════════════════════════════════════════\n");

  const migratedProfiles = await Collections.guestProfiles(db)
    .find({ migratedToUserId: { $exists: true } })
    .project({ _id: 1, migratedToUserId: 1, email: 1 })
    .toArray();

  let doubleCounted = 0;
  let lostSeats = 0;

  for (const profile of migratedProfiles) {
    const orphanedRegs = await Collections.guestEventRegistrations(db)
      .find({
        guestProfileId: profile._id,
        migratedToUserId: { $exists: false },
        status: { $ne: "cancelled" },
      })
      .toArray();

    for (const reg of orphanedRegs) {
      const accountReg = await Collections.eventRegistrations(db).findOne({
        userId: profile.migratedToUserId,
        eventId: reg.eventId,
      });
      if (accountReg) {
        doubleCounted++;
        console.log(
          `⚠ DOUBLE-COUNT: guest=${profile.email} guestRegId=${reg._id} eventId=${reg.eventId}`,
        );
      } else {
        lostSeats++;
        console.log(
          `⚠ LOST-SEAT: guest=${profile.email} guestRegId=${reg._id} eventId=${reg.eventId}`,
        );
      }
    }
  }

  console.log(
    `\n${migratedProfiles.length} migrated profiles checked. ` +
      `${doubleCounted} double-counts, ${lostSeats} lost seats found.\n`,
  );
  issues += doubleCounted + lostSeats;

  console.log("═══════════════════════════════════════════════════");
  console.log("3. registrationClosed DATA INTEGRITY CHECK");
  console.log("═══════════════════════════════════════════════════\n");

  const missingField = await Collections.events(db).countDocuments({
    registrationClosed: { $exists: false },
  });
  if (missingField > 0) {
    issues++;
    console.log(
      `⚠ ${missingField} event(s) missing registrationClosed field entirely ` +
        `(pre-dates the schema change — treated as "open" by all code, but` +
        ` worth backfilling explicitly)`,
    );
  } else {
    console.log("✓ All events have registrationClosed explicitly set.");
  }

  const inconsistentClosed = await Collections.events(db)
    .find({
      registrationClosed: true,
      $or: [
        { registrationClosedAt: { $exists: false } },
        { registrationClosedBy: { $exists: false } },
      ],
    })
    .toArray();
  if (inconsistentClosed.length > 0) {
    issues++;
    console.log(
      `⚠ ${inconsistentClosed.length} event(s) have registrationClosed=true but ` +
        `missing registrationClosedAt/By — likely set via a path that bypassed ` +
        `the admin PATCH route's server-stamping logic:`,
    );
    inconsistentClosed.forEach((e) =>
      console.log(`    - ${e.title} (${e.slug})`),
    );
  } else {
    console.log("✓ All closed events have consistent audit metadata.");
  }

  const staleReasonOnOpen = await Collections.events(db)
    .find({
      registrationClosed: false,
      registrationClosedReason: { $exists: true, $ne: null },
    })
    .toArray();
  if (staleReasonOnOpen.length > 0) {
    issues++;
    console.log(
      `⚠ ${staleReasonOnOpen.length} event(s) are OPEN but still have a stale ` +
        `registrationClosedReason set — reopen logic should have cleared this:`,
    );
    staleReasonOnOpen.forEach((e) =>
      console.log(`    - ${e.title} (${e.slug}): "${e.registrationClosedReason}"`),
    );
  } else {
    console.log("✓ No stale reasons left on reopened events.");
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log(
    issues === 0
      ? "✅ ALL CHECKS PASSED — no issues found."
      : `❌ ${issues} issue(s) found — see warnings above.`,
  );
  console.log("═══════════════════════════════════════════════════\n");

  process.exit(issues > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});