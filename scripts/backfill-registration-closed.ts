// scripts/backfill-registration-closed.ts
// Run: npx tsx --env-file=.env.local scripts/backfill-registration-closed.ts

import { getDb } from "../src/lib/mongodb";
import { Collections } from "../src/lib/db/collections";

async function main() {
  const db = await getDb();

  const missing = await Collections.events(db)
    .find({ registrationClosed: { $exists: false } })
    .project({ _id: 1, title: 1, slug: 1 })
    .toArray();

  console.log(`Found ${missing.length} event(s) missing registrationClosed:`);
  missing.forEach((e) => console.log(`  - ${e.title} (${e.slug})`));

  if (missing.length === 0) {
    console.log("Nothing to do.");
    process.exit(0);
  }

  const result = await Collections.events(db).updateMany(
    { registrationClosed: { $exists: false } },
    { $set: { registrationClosed: false } },
  );

  console.log(
    `\n✓ Backfilled ${result.modifiedCount} event(s) to registrationClosed: false.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
