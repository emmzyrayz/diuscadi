// lib/db/guestRegistrationFilters.ts

// The canonical "this guest registration should count toward totals" filter.
// Excludes cancelled AND already-migrated guest docs (migrated ones are
// represented by their corresponding eventRegistrations doc instead).
export const ACTIVE_UNMIGRATED_GUEST_FILTER = {
  status: { $ne: "cancelled" },
  verifiedAt: { $exists: true },
  migratedToUserId: { $exists: false },
} as const;

// A looser filter for "does this person already have a claim on this
// event as a guest" — used for dedup/reactivation lookups, NOT capacity
// counting. Deliberately does NOT require verifiedAt: legacy
// (pre-OTP-removal) unverified stubs still need to be found so they can
// be reactivated rather than silently ignored and re-created. Does
// exclude migrated docs — once migrated, that person is a full account
// user and their guest doc is kept for audit purposes only, not as a
// live claim.
export const NON_CANCELLED_UNMIGRATED_GUEST_FILTER = {
  status: { $ne: "cancelled" },
  migratedToUserId: { $exists: false },
} as const;