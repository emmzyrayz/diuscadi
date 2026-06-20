// scripts/backfill-guest-profiles.ts
//
// One-time migration: groups existing GuestEventRegistration documents by
// normalized email, creates one GuestProfile per group, and backfills
// guestProfileId onto every matching registration.
//
// Idempotent — safe to re-run. Registrations that already have a
// guestProfileId are skipped on subsequent runs.
//
// Canonical name rule: "most recent registration wins" — same rule used for
// live conflict resolution during migration. Original per-registration
// fullName snapshots are NEVER modified — only the new GuestProfile gets the
// resolved canonical value.
//
// Run once after deploy:
//   pnpm dotenv -e .env.local -- tsx scripts/backfill-guest-profiles.ts

import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { normalizeEmail } from "@/lib/guestProfile";
import type { GuestProfileDocument } from "@/lib/models/GuestProfile";
import type { IGuestEventRegistrationDocument } from "@/lib/models/GuestEventRegistration";

async function backfillGuestProfiles() {
  const db = await getDb();
  const now = new Date();

  // ── 1. Fetch all guest registrations missing guestProfileId ───────────────
  const unmigrated = await Collections.guestEventRegistrations(db)
    .find({ guestProfileId: { $exists: false } })
    .toArray();

  if (unmigrated.length === 0) {
    console.log("✓ No registrations need backfilling. Nothing to do.");
    return;
  }

  console.log(`Found ${unmigrated.length} registrations to backfill.`);

  // ── 2. Group by normalized email ───────────────────────────────────────────
  const grouped = new Map<string, IGuestEventRegistrationDocument[]>();

  for (const reg of unmigrated) {
    const email = normalizeEmail(reg.email);
    const group = grouped.get(email) ?? [];
    group.push(reg);
    grouped.set(email, group);
  }

  console.log(`Grouped into ${grouped.size} unique guest identities.`);

  let profilesCreated = 0;
  let profilesReused = 0;
  let registrationsLinked = 0;
  let profilesBackstamped = 0;

  // ── 3. Process each email group ─────────────────────────────────────────────
  for (const [email, regs] of grouped) {
    // Check if a GuestProfile already exists for this email — could happen
    // if some registrations were already linked by live find-or-create logic
    // (new registrations created after this feature shipped) while older
    // ones from before the shipped date are still missing the link.
    let profile = await Collections.guestProfiles(db).findOne({ email });

    if (!profile) {
      // Canonical name: most recent registration wins (highest registeredAt)
      const mostRecent = [...regs].sort(
        (a, b) =>
          new Date(b.registeredAt).getTime() -
          new Date(a.registeredAt).getTime(),
      )[0];

      const doc: GuestProfileDocument = {
        email,
        fullName: {
          firstname: mostRecent.fullName.firstname,
          lastname: mostRecent.fullName.lastname,
        },
        ...(mostRecent.phone && { phone: mostRecent.phone }),
        migrationOtp: { resendCount: 0, attempts: 0 },
        createdAt: now,
        updatedAt: now,
      };

      const { insertedId } = await Collections.guestProfiles(db).insertOne(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc as any,
      );
      profile = { ...doc, _id: insertedId };
      profilesCreated++;
    } else {
      profilesReused++;
    }

    // ── 4. Backfill guestProfileId onto every registration in this group ────
    const regIds = regs.map((r) => r._id);
    const { modifiedCount } = await Collections.guestEventRegistrations(
      db,
    ).updateMany(
      { _id: { $in: regIds } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $set: { guestProfileId: profile._id as any, updatedAt: now } },
    );
    registrationsLinked += modifiedCount;

    // ── 5. Back-stamp migration status for already-migrated guests ──────────
    // Anyone who went through the OLD migrate-guest flow (raw-email scan,
    // pre-GuestProfile) already has migratedToUserId on their registrations.
    // Without this step, their new GuestProfile would look unmigrated,
    // which would misfire the warm-migrate login popup for someone who
    // already has a working account.
    if (!profile.migratedToUserId) {
      const alreadyMigrated = regs.filter((r) => r.migratedToUserId);

      if (alreadyMigrated.length > 0) {
        // All registrations under one email should carry the same
        // migratedToUserId (migrate-guest stamps them in one updateMany call
        // against the same userDataId) — but take the first non-null value
        // defensively in case of any historical inconsistency.
        const migratedToUserId = alreadyMigrated[0].migratedToUserId;
        const migratedAt = alreadyMigrated.reduce<Date | undefined>(
          (earliest, r) =>
            !earliest || (r.migratedAt && r.migratedAt < earliest)
              ? r.migratedAt
              : earliest,
          undefined,
        );

        await Collections.guestProfiles(db).updateOne(
          { _id: profile._id },
          {
            $set: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              migratedToUserId: migratedToUserId as any,
              migratedAt: migratedAt ?? now,
              updatedAt: now,
            },
          },
        );
        profilesBackstamped++;
      }
    }
  }

  console.log(`\n✅ Backfill complete.`);
  console.log(`  GuestProfiles created:  ${profilesCreated}`);
  console.log(`  GuestProfiles reused:   ${profilesReused}`);
  console.log(`  Registrations linked:   ${registrationsLinked}`);
  console.log(`\  GuestProfiles back-stamped: ${profilesBackstamped}`);
}

if (require.main === module) {
  backfillGuestProfiles()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
