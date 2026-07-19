// scripts/get-event-id.ts
// Quick lookup: prints the eventId for a given slug.
// Run: npx tsx --env-file=.env.local scripts/get-event-id.ts <slug>
import { getDb } from "../src/lib/mongodb";
import { Collections } from "../src/lib/db/collections";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: tsx scripts/get-event-id.ts <slug>");
    process.exit(1);
  }
  const db = await getDb();
  const event = await Collections.events(db).findOne({ slug });
  if (!event) {
    console.error("No event found for that slug.");
    process.exit(1);
  }
  console.log(`eventId: ${event._id!.toString()}`);
  console.log(`title: ${event.title}`);
  console.log(`capacity: ${event.capacity}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
