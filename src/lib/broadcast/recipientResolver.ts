// lib/broadcast/recipientResolver.ts
//
// Single source of truth for resolving broadcast recipients.
// Handles all 18 AudienceType values across both userData (accounts)
// and guestEventRegistrations (guests), with email-level deduplication
// (account takes precedence when both collections share an email).

import { Db, Document, Filter, ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import { AudienceType, BroadcastFilter } from "@/types/broadcast";

// ── Output types ───────────────────────────────────────────────────────────────

export interface ResolvedRecipient {
  email: string;
  fullName: string;
  type: "account" | "guest";
  userId?: string; // userData._id — present for account recipients only
}

export interface ResolveResult {
  recipients: ResolvedRecipient[];
  accountCount: number;
  guestCount: number;
  total: number;
}

// ── Audience classification ────────────────────────────────────────────────────

const ACCOUNT_AUDIENCES: AudienceType[] = [
  "all_accounts",
  "verified_members",
  "pending_members",
  "unverified_accounts",
  "active_accounts_only",
  "by_role",
  "by_committee",
  "by_committee_role",
  "by_edu_status",
  "global_announcement",
  "all_users",
  "event_registrants",
];

const GUEST_AUDIENCES: AudienceType[] = [
  "all_guests",
  "verified_guests_only",
  "unverified_guests",
  "guests_by_event",
  "guests_by_status",
  "all_users",
  "event_registrants",
];

// ── Account pipeline builders ──────────────────────────────────────────────────

function buildAccountPreMatch(filter: BroadcastFilter): Filter<Document> {
  switch (filter.audience) {
    case "verified_members":
      return { membershipStatus: "approved" };
    case "pending_members":
      return { membershipStatus: "pending" };
    case "unverified_accounts":
      return { membershipStatus: { $nin: ["approved", "pending"] } };
    case "active_accounts_only":
      return { isAccountActive: true };
    case "by_committee":
      return { "committeeMembership.committee": filter.committee };
    case "by_committee_role":
      return {
        "committeeMembership.committee": filter.committee,
        "committeeMembership.role": filter.committeeRole,
      };
    // by_role and by_edu_status: filtered post-vault-lookup (see buildAccountPostMatch)
    default:
      return {};
  }
}

function buildAccountPostMatch(
  filter: BroadcastFilter,
): Filter<Document> | null {
  switch (filter.audience) {
    case "by_role":
      return filter.role ? { "_vault.role": filter.role } : null;
    case "by_edu_status":
      // eduStatus lives on vault — matched after $lookup
      return filter.eduStatus ? { "_vault.eduStatus": filter.eduStatus } : null;
    default:
      return null;
  }
}

// ── Guest filter builder ───────────────────────────────────────────────────────

function buildGuestMatch(filter: BroadcastFilter): Filter<Document> | null {
  if (!GUEST_AUDIENCES.includes(filter.audience)) return null;

  // Base: only verified guests are contactable
  const verifiedBase: Filter<Document> = {
    verifiedAt: { $exists: true, $ne: null },
  };

  switch (filter.audience) {
    case "all_guests":
    case "verified_guests_only":
    case "all_users":
      return verifiedBase;

    case "unverified_guests":
      // Pending OTP — no verifiedAt, but emailVerificationExpires is still set
      return {
        verifiedAt: { $exists: false },
        emailVerificationExpires: { $exists: true, $gt: new Date() },
      };

    case "guests_by_event":
    case "event_registrants":
      if (!filter.eventId || !ObjectId.isValid(filter.eventId)) {
        return verifiedBase; // no eventId: fall back to all verified
      }
      return { ...verifiedBase, eventId: new ObjectId(filter.eventId) };

    case "guests_by_status":
      return {
        ...verifiedBase,
        ...(filter.guestStatus ? { status: filter.guestStatus } : {}),
      };

    default:
      return verifiedBase;
  }
}

// ── Account fetcher ───────────────────────────────────────────────────────────

async function fetchAccountRecipients(
  db: Db,
  filter: BroadcastFilter,
): Promise<ResolvedRecipient[]> {
  if (!ACCOUNT_AUDIENCES.includes(filter.audience)) return [];

  let preMatch = buildAccountPreMatch(filter);
  const postMatch = buildAccountPostMatch(filter);

  // event_registrants: scope userData to users who have a registration for the event
  if (
    filter.audience === "event_registrants" &&
    filter.eventId &&
    ObjectId.isValid(filter.eventId)
  ) {
    const regs = await Collections.eventRegistrations(db)
      .find(
        { eventId: new ObjectId(filter.eventId) },
        { projection: { userId: 1 } },
      )
      .toArray();
    const userIds = regs.map((r) => r.userId);
    // Merge with any existing preMatch — for event_registrants preMatch is {}
    preMatch = { ...preMatch, _id: { $in: userIds } };
  }

  const pipeline: Document[] = [
    { $match: preMatch },
    {
      $lookup: {
        from: "vault",
        localField: "vaultId",
        foreignField: "_id",
        as: "_vault",
      },
    },
    { $unwind: { path: "$_vault", preserveNullAndEmptyArrays: true } },
    ...(postMatch ? [{ $match: postMatch }] : []),
    {
      $project: {
        _id: 1,
        email: "$_vault.email",
        firstname: "$fullName.firstname",
        lastname: "$fullName.lastname",
      },
    },
  ];

  const docs = await Collections.userData(db)
    .aggregate<{
      _id: ObjectId;
      email: string | null;
      firstname?: string;
      lastname?: string;
    }>(pipeline)
    .toArray();

  return docs
    .filter((d) => !!d.email)
    .map((d) => ({
      email: d.email!.toLowerCase().trim(),
      fullName: `${d.firstname ?? ""} ${d.lastname ?? ""}`.trim(),
      type: "account" as const,
      userId: d._id.toString(),
    }));
}

// ── Guest fetcher ─────────────────────────────────────────────────────────────

async function fetchGuestRecipients(
  db: Db,
  filter: BroadcastFilter,
): Promise<ResolvedRecipient[]> {
  const match = buildGuestMatch(filter);
  if (match === null) return [];

  const docs = await Collections.guestEventRegistrations(db)
    .aggregate<{
      _id: ObjectId;
      email: string;
      firstname?: string;
      lastname?: string;
    }>([
      { $match: match },
      {
        $project: {
          _id: 1,
          email: 1,
          firstname: "$fullName.firstname",
          lastname: "$fullName.lastname",
        },
      },
    ])
    .toArray();

  return docs
    .filter((d) => !!d.email)
    .map((d) => ({
      email: d.email.toLowerCase().trim(),
      fullName: `${d.firstname ?? ""} ${d.lastname ?? ""}`.trim(),
      type: "guest" as const,
    }));
}

// ── Main resolver ─────────────────────────────────────────────────────────────
//
// Runs account and guest fetches in parallel, then deduplicates by email.
// Accounts always take precedence — if a guest email matches an account
// email, the account record is kept and the guest record is dropped.

export async function resolveRecipients(
  db: Db,
  filter: BroadcastFilter,
): Promise<ResolveResult> {
  const [accountRaw, guestRaw] = await Promise.all([
    fetchAccountRecipients(db, filter),
    fetchGuestRecipients(db, filter),
  ]);

  const seen = new Set<string>();
  const accounts: ResolvedRecipient[] = [];
  const guests: ResolvedRecipient[] = [];

  for (const r of accountRaw) {
    if (!seen.has(r.email)) {
      seen.add(r.email);
      accounts.push(r);
    }
  }

  for (const r of guestRaw) {
    if (!seen.has(r.email)) {
      seen.add(r.email);
      guests.push(r);
    }
  }

  return {
    recipients: [...accounts, ...guests],
    accountCount: accounts.length,
    guestCount: guests.length,
    total: accounts.length + guests.length,
  };
}
