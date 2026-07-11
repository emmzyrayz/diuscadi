// lib/db/guestRegistrationFilters.ts

// The canonical "this guest registration should count toward totals" filter.
// Excludes cancelled AND already-migrated guest docs (migrated ones are
// represented by their corresponding eventRegistrations doc instead).
export const ACTIVE_UNMIGRATED_GUEST_FILTER = {
  status: { $ne: "cancelled" },
  verifiedAt: { $exists: true },
  migratedToUserId: { $exists: false },
} as const;
