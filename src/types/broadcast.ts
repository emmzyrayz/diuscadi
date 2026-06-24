import { ObjectId } from "mongodb";

export type AudienceType =
  // ── Account Users Only ────────────────────────────────────────────────────
  | "all_accounts" // All account users (verified + pending)
  | "verified_members" // membershipStatus === "approved"
  | "pending_members" // membershipStatus === "pending"
  | "unverified_accounts" // No membership, account active
  | "by_role" // Filter by Vault.role
  | "by_committee" // Filter by committee membership
  | "by_committee_role" // Filter by committee role
  | "by_edu_status" // Filter by STUDENT or GRADUATE
  | "active_accounts_only" // isAccountActive === true

  // ── Guest Users Only ──────────────────────────────────────────────────────
  | "all_guests" // All verified guests across all events
  | "verified_guests_only" // Guests with verifiedAt timestamp
  | "unverified_guests" // Guests pending email verification
  | "guests_by_event" // Guests registered for specific event
  | "guests_by_status" // Guests by registration status

  // ── Hybrid ────────────────────────────────────────────────────────────────
  | "all_users" // Both account + guest users
  | "event_registrants" // All registered for specific event (acct + guest)
  | "global_announcement"; // All accounts (no guests)

export interface BroadcastFilter {
  audience: AudienceType;

  // Account-specific filters
  role?: string; // if audience === "by_role"
  committee?: string; // if audience === "by_committee"
  committeeRole?: string; // if audience === "by_committee_role"
  eduStatus?: "STUDENT" | "GRADUATE";

  // Guest-specific filters
  eventId?: string; // if audience === "guests_by_event"
  guestStatus?: GuestRegistrationStatus; // if audience === "guests_by_status"

  // Hybrid filters
  linkedEventId?: string; // Event to link to broadcast (optional)
}

export type GuestRegistrationStatus = "registered" | "checked-in" | "cancelled";

export interface BroadcastMessage {
  _id?: ObjectId;
  subject: string;
  htmlContent: string; // Rich HTML body (editor)
  textContent?: string; // Auto-generated fallback

  filter: BroadcastFilter;
  linkedEvent?: {
    _id: ObjectId;
    title: string;
    date: Date;
  } | null;

  // Scheduling
  sendImmediately: boolean;
  scheduledFor?: Date;

  // Stats
  totalRecipients?: number;
  sentCount?: number;
  failedCount?: number;

  status: "draft" | "scheduled" | "sent" | "failed";
  createdBy: ObjectId; // Admin Vault._id
  createdAt: Date;
  sentAt?: Date;
  updatedAt: Date;
  templateId?: BroadcastTemplateId;
  templateFields?: Record<string, unknown>;
}

export interface BroadcastRecipient {
  email: string;
  fullName: string;
  userId: ObjectId; // UserData._id
  matchedFilters: string[]; // ["verified_members", "committee:media"]
}

export type BroadcastTemplateId =
  | "raw_html"              // existing — admin writes HTML directly
  | "urgent_notice"         // pre-styled urgent/critical alert
  | "general_announcement"  // standard announcement with optional bullet list
  | "event_promotion"       // structured event fields
  | "community_update"      // multi-section community news
  | "platform_update";      // maintenance / feature launch / critical notice