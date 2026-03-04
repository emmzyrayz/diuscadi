// lib/models/EventRegistration.ts
//
// One document per user per event registration.
// A "ticket" in the UI is simply an enriched EventRegistration
// joined with Event + TicketType.

import { ObjectId } from "mongodb";

export type RegistrationStatus = "registered" | "checked-in" | "cancelled";

export interface EventRegistrationDocument {
  _id?: ObjectId;

  userId: ObjectId; // → UserData._id
  eventId: ObjectId; // → Event._id
  ticketTypeId: ObjectId; // → TicketType._id

  // ── Invite / check-in ─────────────────────────────────────────────────────
  inviteCode: string; // unique per registration — used for QR + check-in

  // ── Referral (optional) ───────────────────────────────────────────────────
  referralCodeUsed?: string; // invite code of the user who referred this person

  // ── Status ────────────────────────────────────────────────────────────────
  status: RegistrationStatus;

  // ── Timestamps ────────────────────────────────────────────────────────────
  registeredAt: Date;
  checkedInAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
