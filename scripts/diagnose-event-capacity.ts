// scripts/diagnose-event-capacity.ts
//
// Run: npx tsx --env-file=.env.local scripts/diagnose-event-capacity.ts <eventId>
//
// Prints the capacity/registration counts for one event exactly as each
// route currently computes them, side by side, so we can see precisely
// where the numbers diverge.

import { getDb } from "../src/lib/mongodb";
import { Collections } from "../src/lib/db/collections";
import { ObjectId } from "mongodb";

async function main() {
  const eventIdArg = process.argv[2];
  if (!eventIdArg || !ObjectId.isValid(eventIdArg)) {
    console.error("Usage: tsx scripts/diagnose-event-capacity.ts <eventId>");
    process.exit(1);
  }

  const db = await getDb();
  const eventObjId = new ObjectId(eventIdArg);

  const event = await Collections.events(db).findOne({ _id: eventObjId });
  if (!event) {
    console.error("Event not found.");
    process.exit(1);
  }

  const ticketTypes = await Collections.ticketTypes(db)
    .find({ eventId: eventObjId })
    .toArray();

  console.log(`\nEvent: ${event.title}`);
  console.log(`Overall capacity: ${event.capacity}\n`);

  // ── Whole-event counts, several ways ────────────────────────────────────
  const accountAll = await Collections.eventRegistrations(db).countDocuments({
    eventId: eventObjId,
    status: { $ne: "cancelled" },
  });

  const guestAllEver = await Collections.guestEventRegistrations(
    db,
  ).countDocuments({
    eventId: eventObjId,
    status: { $ne: "cancelled" },
  });

  const guestUnmigrated = await Collections.guestEventRegistrations(
    db,
  ).countDocuments({
    eventId: eventObjId,
    status: { $ne: "cancelled" },
    migratedToUserId: { $exists: false },
  });

  const guestMigrated = guestAllEver - guestUnmigrated;

  console.log("── Event-level totals ─────────────────────────────");
  console.log(`accountEventRegistrations (all):           ${accountAll}`);
  console.log(`guestEventRegistrations (all, incl. migrated): ${guestAllEver}`);
  console.log(`guestEventRegistrations (unmigrated only):  ${guestUnmigrated}`);
  console.log(`guestEventRegistrations (migrated):         ${guestMigrated}`);
  console.log("");
  console.log(
    `What /api/events/register sees as "totalRegistered":       ${accountAll}`,
  );
  console.log(
    `What /api/events/register-guest sees as total:             ${accountAll + guestUnmigrated}`,
  );
  console.log(
    `What admin /api/admin/analytics sums (platform-wide, fyi): accountAll + guestUnmigrated pattern`,
  );
  console.log("");

  // ── Per ticket-tier counts ──────────────────────────────────────────────
  console.log("── Per ticket-tier ─────────────────────────────────");
  for (const tier of ticketTypes) {
    const tierAccountAll = await Collections.eventRegistrations(
      db,
    ).countDocuments({
      eventId: eventObjId,
      ticketTypeId: tier._id,
      status: { $ne: "cancelled" },
    });

    const tierGuestUnmigrated = await Collections.guestEventRegistrations(
      db,
    ).countDocuments({
      eventId: eventObjId,
      ticketTypeId: tier._id,
      status: { $ne: "cancelled" },
      migratedToUserId: { $exists: false },
    });

    const tierGuestAll = await Collections.guestEventRegistrations(
      db,
    ).countDocuments({
      eventId: eventObjId,
      ticketTypeId: tier._id,
      status: { $ne: "cancelled" },
    });

    console.log(
      `\nTier: ${tier.name ?? tier._id} (maxQuantity: ${tier.maxQuantity})`,
    );
    console.log(`  accountRegistrations (all):          ${tierAccountAll}`);
    console.log(
      `  guestRegistrations (unmigrated):     ${tierGuestUnmigrated}`,
    );
    console.log(`  guestRegistrations (all incl. migr): ${tierGuestAll}`);
    console.log(
      `  /register would compare:             ${tierAccountAll} >= ${tier.maxQuantity} -> ${tierAccountAll >= tier.maxQuantity ? "BLOCKS account users" : "allows"}`,
    );
    console.log(
      `  /register-guest would compare:       ${tierAccountAll + tierGuestUnmigrated} >= ${tier.maxQuantity} -> ${tierAccountAll + tierGuestUnmigrated >= tier.maxQuantity ? "BLOCKS guests" : "allows"}`,
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
