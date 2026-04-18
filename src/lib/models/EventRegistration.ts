// lib/models/EventRegistration.ts
// Represents a single user registration for an event.
// status lifecycle: registered → checked-in (terminal success)
//                  registered → cancelled  (terminal cancel)

export type RegistrationStatus = "registered" | "checked-in" | "cancelled";

export interface EventRegistrationDocument {
  _id?: import("mongodb").ObjectId;

  userId: import("mongodb").ObjectId; // → userData._id
  eventId: import("mongodb").ObjectId; // → events._id
  ticketTypeId: import("mongodb").ObjectId; // → ticketTypes._id

  inviteCode: string; // unique short code — used for QR + referrals
  referralCodeUsed: string | null; // inviteCode of the referrer, if any

  status: RegistrationStatus;

  registeredAt: Date;
  checkedInAt?: Date; // set when status → "checked-in"

  // ── Reminder tracking ────────────────────────────────────────────────────
  // Prevents the cron job from sending duplicate reminder emails.
  // Each field is set to the timestamp of the send so we have an audit trail.
  reminders?: {
    sent24h?: Date; // set when the 24-hour reminder is dispatched
    sent1h?: Date; // reserved for a future 1-hour reminder cron
  };

  createdAt: Date;
  updatedAt: Date;
}
