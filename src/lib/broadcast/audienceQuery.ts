// lib/broadcast/audienceQuery.ts
import { Filter, Document } from "mongodb";
import { BroadcastFilter } from "@/types/broadcast";

/**
 * Builds the $match query against the userData collection.
 * For audiences that need post-lookup filtering (e.g. by_role),
 * call buildPostLookupMatch() to get the additional pipeline stage.
 */
export function buildAudienceQuery(filter: BroadcastFilter): Filter<Document> {
  switch (filter.audience) {
    case "all_accounts":
    case "all_users":
    case "global_announcement":
      return {};

    case "verified_members":
      return { membershipStatus: "approved" };

    case "pending_members":
      return { membershipStatus: "pending" };

    case "unverified_accounts":
      return {
        membershipStatus: { $nin: ["approved", "pending"] },
      };

    case "active_accounts_only":
      return { isActive: true };

    case "by_committee":
      return {
        "committeeMembership.committee": filter.committee,
      };

    case "by_committee_role":
      return {
        "committeeMembership.committee": filter.committee,
        "committeeMembership.role": filter.committeeRole,
      };

    case "by_edu_status":
      return { "Institution.educationStatus": filter.eduStatus };

    case "event_registrants":
      // Handled separately via eventRegistrations — no userData filter
      return {};

    // Guest audiences live in guestEventRegistrations, not userData
    case "all_guests":
    case "verified_guests_only":
    case "unverified_guests":
    case "guests_by_event":
    case "guests_by_status":
      return {};

    // by_role: vault join required, filtered post-lookup
    case "by_role":
      return {};
  }
}

/**
 * Additional $match to add AFTER the vault $lookup + $unwind.
 * Returns null when no post-lookup filter is needed.
 */
export function buildPostLookupMatch(
  filter: BroadcastFilter,
): Filter<Document> | null {
  if (filter.audience === "by_role" && filter.role) {
    return { "_vault.role": filter.role };
  }
  return null;
}
