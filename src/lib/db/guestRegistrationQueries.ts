// lib/db/guestRegistrationQueries.ts
//
// Named, single-purpose helpers for the guest-registration lookups that
// were previously hand-rolled inline (and drifting) across
// register-guest/route.ts and migrate-guest/route.ts. Every new guest
// lookup should go through one of these — or a new named helper added
// here — rather than a fresh inline filter.

import type { Db, ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import {
  ACTIVE_UNMIGRATED_GUEST_FILTER,
  NON_CANCELLED_UNMIGRATED_GUEST_FILTER,
} from "@/lib/db/guestRegistrationFilter";

/**
 * Finds an existing (non-cancelled, non-migrated) guest registration for
 * a given email + event — used to detect "this person already has a
 * claim on this event" during guest registration (dedup / reactivation).
 *
 * Deliberately does NOT require verifiedAt (see
 * NON_CANCELLED_UNMIGRATED_GUEST_FILTER) so legacy unverified stubs are
 * still found and can be reactivated rather than silently orphaned.
 *
 * Migrated guests are excluded: once migrated, that person is a full
 * account user and register-guest's own vault-match check (step 7)
 * handles them — this function only needs to see guests who are still
 * guests.
 */
export async function findActiveGuestRegistration(
  db: Db,
  params: { email: string; eventId: ObjectId },
  projection?: Record<string, 1 | 0>,
) {
  return Collections.guestEventRegistrations(db).findOne(
    {
      email: params.email,
      eventId: params.eventId,
      ...NON_CANCELLED_UNMIGRATED_GUEST_FILTER,
    },
    projection ? { projection } : undefined,
  );
}

/**
 * Resolves the referrer for a given event invite code, checking both
 * account registrations and active/verified/unmigrated guest
 * registrations.
 *
 * Migrated guest referrers are intentionally NOT matched on the guest
 * side here: migrate-guest carries the original inviteCode over onto the
 * referrer's new eventRegistrations doc (see migrate-guest step 12), so
 * the account-side lookup already covers them once migrated. Matching
 * them again on the stale guest doc would be redundant, not wrong, but
 * there's no reason to do the extra lookup.
 *
 * Uses the full ACTIVE_UNMIGRATED_GUEST_FILTER (including verifiedAt) —
 * an unverified guest shouldn't be creditable as a referrer.
 */
export async function findReferrerByInviteCode(
  db: Db,
  params: { inviteCode: string; eventId: ObjectId },
): Promise<{
  accountReferrer: { _id: ObjectId; userId?: ObjectId } | null;
  guestReferrer: { _id: ObjectId } | null;
}> {
  const [accountReferrer, guestReferrer] = await Promise.all([
    Collections.eventRegistrations(db).findOne(
      { inviteCode: params.inviteCode, eventId: params.eventId },
      { projection: { _id: 1, userId: 1 } },
    ),
    Collections.guestEventRegistrations(db).findOne(
      {
        inviteCode: params.inviteCode,
        eventId: params.eventId,
        ...ACTIVE_UNMIGRATED_GUEST_FILTER,
      },
      { projection: { _id: 1 } },
    ),
  ]);

  return {
    accountReferrer: accountReferrer as {
      _id: ObjectId;
      userId?: ObjectId;
    } | null,
    guestReferrer: guestReferrer as { _id: ObjectId } | null,
  };
}
