// scripts/inspect-lost-seat.ts
// Run: npx tsx --env-file=.env.local scripts/inspect-lost-seat.ts

import { ObjectId } from "mongodb";
import { getDb } from "../src/lib/mongodb";
import { Collections } from "../src/lib/db/collections";

const GUEST_REG_ID = "6a624aecef4570898db27709";
const EVENT_ID = "6a62420ee8611af1ccf30e7a";

async function main() {
  const db = await getDb();

  const guestReg = await Collections.guestEventRegistrations(db).findOne({
    _id: new ObjectId(GUEST_REG_ID),
  });
  console.log("── Guest registration ──────────────────────────");
  console.log(JSON.stringify(guestReg, null, 2));

  if (!guestReg?.guestProfileId) {
    console.log("\nNo guestProfileId on this registration — stopping.");
    process.exit(0);
  }

  const profile = await Collections.guestProfiles(db).findOne({
    _id: guestReg.guestProfileId,
  });
  console.log("\n── Guest profile ────────────────────────────────");
  console.log(JSON.stringify(profile, null, 2));

  if (profile?.migratedToUserId) {
    const vault = await Collections.vault(db).findOne({
      email: profile.email,
    });
    console.log("\n── Vault account ─────────────────────────────────");
    console.log(JSON.stringify(vault, null, 2));

    const eventReg = await Collections.eventRegistrations(db).findOne({
      userId: profile.migratedToUserId,
      eventId: new ObjectId(EVENT_ID),
    });
    console.log("\n── Matching eventRegistrations doc (expected, missing) ──");
    console.log(
      eventReg
        ? JSON.stringify(eventReg, null, 2)
        : "NONE FOUND — confirms lost seat",
    );

    const allEventRegsForUser = await Collections.eventRegistrations(db)
      .find({ userId: profile.migratedToUserId })
      .toArray();
    console.log(
      `\nThis account has ${allEventRegsForUser.length} eventRegistrations doc(s) total ` +
        `(across ALL events) — helps tell if migration failed for just this event or entirely:`,
    );
    allEventRegsForUser.forEach((r) =>
      console.log(`  - eventId=${r.eventId} inviteCode=${r.inviteCode}`),
    );
  }

  const event = await Collections.events(db).findOne({
    _id: new ObjectId(EVENT_ID),
  });
  console.log("\n── Event ──────────────────────────────────────────");
  console.log(`Title: ${event?.title}, slug: ${event?.slug}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
