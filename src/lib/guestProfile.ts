// lib/guestProfile.ts
//
// Shared helpers for GuestProfile — identity resolution, linked registration
// lookup, the atomic migration guard, and N-way conflict detection used by
// both the cold-migrate (OTP) and warm-migrate (login-triggered) flows.

import { Db, ObjectId } from "mongodb";
import { signJWT } from "@/lib/auth";
import { Collections } from "@/lib/db/collections";
import type { GuestProfileDocument } from "@/lib/models/GuestProfile";
import type { IGuestEventRegistrationDocument } from "@/lib/models/GuestEventRegistration";
import type { PhoneNumber } from "@/types/domain";

// ─────────────────────────────────────────────────────────────────────────────
// Email normalization
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function isDuplicateKeyError(err: unknown): boolean {
  return !!(
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Find-or-create — called at guest registration time.
// Race-safe: on a duplicate-key error from concurrent registrations under
// the same new email, re-fetches instead of failing.
// ─────────────────────────────────────────────────────────────────────────────

export async function findOrCreateGuestProfile(
  db: Db,
  opts: {
    email: string;
    firstname: string;
    lastname: string;
    phone?: PhoneNumber;
  },
): Promise<GuestProfileDocument> {
  const email = normalizeEmail(opts.email);

  const existing = await Collections.guestProfiles(db).findOne({ email });
  if (existing) return existing;

  const now = new Date();
  const doc: GuestProfileDocument = {
    email,
    fullName: {
      firstname: opts.firstname.trim(),
      lastname: opts.lastname.trim(),
    },
    ...(opts.phone && { phone: opts.phone }),
    migrationOtp: { resendCount: 0, attempts: 0 },
    createdAt: now,
    updatedAt: now,
  };

  try {
    const { insertedId } = await Collections.guestProfiles(db).insertOne(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      doc as any,
    );
    return { ...doc, _id: insertedId };
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      const raceWinner = await Collections.guestProfiles(db).findOne({ email });
      if (raceWinner) return raceWinner;
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Linked registrations — every active (non-cancelled) guest registration
// under one profile, used by both cold-migrate confirm and warm-migrate scan.
// ─────────────────────────────────────────────────────────────────────────────

export async function getLinkedRegistrations(
  db: Db,
  guestProfileId: ObjectId,
): Promise<IGuestEventRegistrationDocument[]> {
  return Collections.guestEventRegistrations(db)
    .find({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      guestProfileId: guestProfileId as any,
      status: { $ne: "cancelled" },
    })
    .toArray();
}

// ─────────────────────────────────────────────────────────────────────────────
// Atomic migration guard — prevents double-processing when the same user
// is logged in on two tabs/devices and both hit the no-conflict 48hr
// auto-migrate path at once. Only one caller will see this return true.
//
// NOTE: return shape of findOneAndUpdate varies by mongodb driver major
// version — v6 returns the document (or null) directly; v4/v5 wrap it as
// { value }. Adjust the `result` check below if your driver version differs.
// ─────────────────────────────────────────────────────────────────────────────

export async function claimGuestProfileForMigration(
  db: Db,
  guestProfileId: ObjectId,
): Promise<boolean> {
  const result = await Collections.guestProfiles(db).findOneAndUpdate(
    {
      _id: guestProfileId,
      migratedToUserId: { $exists: false },
      mergeStatus: { $in: ["pending", "snoozed"] },
    },
    { $set: { mergeStatus: "migrating", updatedAt: new Date() } },
  );

  // Driver v6: result is the matched document or null.
  // Driver v4/v5: result is { value: document | null } — use result?.value instead.
  return !!result;
}

// ─────────────────────────────────────────────────────────────────────────────
// N-way conflict detection — shared by MigrateDiffModal for both cold-migrate
// (manual OTP path) and warm-migrate (login popup) flows. Only flags a field
// if 2+ distinct values exist across the guest's registrations.
// ─────────────────────────────────────────────────────────────────────────────

export interface NameConflictValue {
  value: string;
  registrationIds: string[];
}

export interface NameConflict {
  field: "firstname" | "lastname";
  values: NameConflictValue[];
}

export function detectNameConflicts(
  registrations: Pick<IGuestEventRegistrationDocument, "_id" | "fullName">[],
): NameConflict[] {
  const conflicts: NameConflict[] = [];

  (["firstname", "lastname"] as const).forEach((field) => {
    const grouped = new Map<string, string[]>();

    for (const reg of registrations) {
      const value = (reg.fullName?.[field] ?? "").trim();
      if (!value) continue;
      const ids = grouped.get(value) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ids.push(String((reg as any)._id));
      grouped.set(value, ids);
    }

    if (grouped.size > 1) {
      conflicts.push({
        field,
        values: Array.from(grouped.entries()).map(
          ([value, registrationIds]) => ({
            value,
            registrationIds,
          }),
        ),
      });
    }
  });

  return conflicts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve a guest registration + its GuestProfile together, with defensive
// backfill if guestProfileId is somehow still missing (legacy record that
// predates the backfill script, or created in a window before it ran).
// Shared by request-otp, verify-otp, and resolve-conflicts.
// ─────────────────────────────────────────────────────────────────────────────

export type ResolveProfileResult =
  | { ok: true; registration: IGuestEventRegistrationDocument; profile: GuestProfileDocument }
  | { ok: false; reason: "not_found" | "cancelled" };

export async function resolveGuestProfileForRegistration(
  db: Db,
  registrationId: ObjectId,
  email: string,
): Promise<ResolveProfileResult> {
  const emailLower = normalizeEmail(email);

  const registration = await Collections.guestEventRegistrations(db).findOne({
    _id: registrationId,
  });

  if (!registration || registration.email !== emailLower) {
    return { ok: false, reason: "not_found" };
  }
  if (registration.status === "cancelled") {
    return { ok: false, reason: "cancelled" };
  }

  let profile: GuestProfileDocument | null = null;

  if (registration.guestProfileId) {
    profile = await Collections.guestProfiles(db).findOne({
      _id: registration.guestProfileId,
    });
  }

  // Defensive backfill — same pattern used in register-guest's existingGuest branch
  if (!profile) {
    profile = await findOrCreateGuestProfile(db, {
      email: emailLower,
      firstname: registration.fullName.firstname,
      lastname: registration.fullName.lastname,
      ...(registration.phone && { phone: registration.phone }),
    });
    await Collections.guestEventRegistrations(db).updateOne(
      { _id: registration._id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $set: { guestProfileId: profile._id as any, updatedAt: new Date() } },
    );
  }

  return { ok: true, registration, profile };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mint the migration JWT + URL. Shared by verify-otp (no-conflict path) and
// resolve-conflicts (post-conflict-resolution path).
// ─────────────────────────────────────────────────────────────────────────────

export function mintMigrationToken(opts: {
  guestProfileId: ObjectId;
  guestRegistrationId: ObjectId;
  email: string;
  firstName: string;
  lastName: string;
}): { migrationToken: string; migrationUrl: string; expiresAt: string } {
  const migrationToken = signJWT(
    {
      vaultId: "migration",
      sessionId: "migration",
      role: "guest",
      tokenVersion: 0,
      ...({
        guestProfileId: opts.guestProfileId.toString(),
        guestRegistrationId: opts.guestRegistrationId.toString(),
        email: opts.email,
        firstName: opts.firstName,
        lastName: opts.lastName,
        purpose: "guest-migration",
      } as object),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    "24h",
  );

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    migrationToken,
    migrationUrl: `${APP_URL}/migrate/guest?token=${migrationToken}`,
    expiresAt: expiresAt.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Link every unmigrated registration under a GuestProfile to an ALREADY-
// EXISTING account (warm-migrate path). Distinct from migrate-guest's cold
// path: no Vault/UserData creation here, and analytics are incremented
// ($inc) rather than set ($set), since the account may already have its own
// registration history.
// ─────────────────────────────────────────────────────────────────────────────

export async function linkGuestTicketsToUserAccount(
  db: Db,
  guestProfileId: ObjectId,
  userId: ObjectId,
): Promise<{ migratedCount: number; checkedInCount: number }> {
  const linked = await getLinkedRegistrations(db, guestProfileId);
  const now = new Date();
  let migratedCount = 0;

  for (const guestReg of linked) {
    if (guestReg.migratedToUserId) continue;
    try {
      const existing = await Collections.eventRegistrations(db).findOne(
        { userId, eventId: guestReg.eventId },
        { projection: { _id: 1 } },
      );
      if (!existing) {
        await Collections.eventRegistrations(db).insertOne({
          userId,
          eventId: guestReg.eventId,
          ticketTypeId: guestReg.ticketTypeId,
          inviteCode: guestReg.inviteCode,
          referralCodeUsed: guestReg.referralCodeUsed ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: guestReg.status as any,
          registeredAt: guestReg.registeredAt ?? now,
          ...(guestReg.checkedInAt && { checkedInAt: guestReg.checkedInAt }),
          ...(guestReg.reminders && { reminders: guestReg.reminders }),
          createdAt: now,
          updatedAt: now,
        });
      }
      migratedCount++;
    } catch (err) {
      console.error(`[linkGuestTicketsToUserAccount] Failed for ${guestReg._id}:`, err);
    }
  }

  const checkedInCount = linked.filter((r) => r.status === "checked-in").length;

  await Collections.guestEventRegistrations(db).updateMany(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { guestProfileId: guestProfileId as any },
    { $set: { migratedToUserId: userId, migratedAt: now, updatedAt: now } },
  );

  await Collections.guestProfiles(db).updateOne(
    { _id: guestProfileId },
    {
      $set: {
        migratedToUserId: userId,
        migratedAt: now,
        mergeStatus: "migrated",
        updatedAt: now,
      },
    },
  );

  // $inc, NOT $set — this account may already have its own analytics.
  // (migrate-guest's cold path uses $set because that account is brand new.)
  await Collections.userData(db).updateOne(
    { _id: userId },
    {
      $inc: {
        "analytics.eventsRegistered": migratedCount,
        "analytics.eventsAttended": checkedInCount,
      },
      $set: { updatedAt: now },
    },
  );

  return { migratedCount, checkedInCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Event summaries for the GuestMergePopup display list.
// ─────────────────────────────────────────────────────────────────────────────

export interface LinkedGuestEventSummary {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
}

export async function getLinkedEventSummaries(
  db: Db,
  guestProfileId: ObjectId,
): Promise<LinkedGuestEventSummary[]> {
  const linked = await getLinkedRegistrations(db, guestProfileId);
  if (linked.length === 0) return [];

  const eventIds = linked.map((r) => r.eventId);
  const events = await Collections.events(db)
    .find({ _id: { $in: eventIds } }, { projection: { title: 1, eventDate: 1 } })
    .toArray();
  const eventMap = new Map(events.map((e) => [String(e._id), e]));

  return linked.map((r) => {
    const ev = eventMap.get(String(r.eventId));
    return {
      registrationId: String(r._id),
      eventId: String(r.eventId),
      eventTitle: ev ? String(ev.title) : "Unknown Event",
      eventDate: ev ? new Date(ev.eventDate).toISOString() : "",
    };
  });
}