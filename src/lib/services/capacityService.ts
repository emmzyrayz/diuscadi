// src/lib/services/capacityService.ts
//
// Single source of truth for "how many seats are taken" — used by both
// /api/events/register and /api/events/register-guest, and matches the
// same formula used by app/events/[slug]/page.tsx and the admin analytics
// route. Having ONE function for this means the two registration routes
// can never drift out of sync with each other again.

import type { Db, ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import { ACTIVE_UNMIGRATED_GUEST_FILTER } from "@/lib/db/guestRegistrationFilter";

/**
 * Counts active registrations for an event, optionally scoped to one
 * ticket tier. Sums account registrations (eventRegistrations) and
 * unmigrated guest registrations (guestEventRegistrations) — migrated
 * guests are excluded because they're represented by their corresponding
 * eventRegistrations doc instead, and counting both would double-count.
 */
export async function getRegisteredCount(
  db: Db,
  eventId: ObjectId,
  ticketTypeId?: ObjectId,
): Promise<number> {
  const [accountCount, guestCount] = await Promise.all([
    Collections.eventRegistrations(db).countDocuments({
      eventId,
      status: { $ne: "cancelled" },
      ...(ticketTypeId && { ticketTypeId }),
    }),
    Collections.guestEventRegistrations(db).countDocuments({
      eventId,
      ...ACTIVE_UNMIGRATED_GUEST_FILTER,
      ...(ticketTypeId && { ticketTypeId }),
    }),
  ]);

  return accountCount + guestCount;
}

/**
 * Convenience wrapper for the common "is this tier/event full?" check.
 */
export async function isAtCapacity(
  db: Db,
  eventId: ObjectId,
  limit: number,
  ticketTypeId?: ObjectId,
): Promise<boolean> {
  const count = await getRegisteredCount(db, eventId, ticketTypeId);
  return count >= limit;
}
