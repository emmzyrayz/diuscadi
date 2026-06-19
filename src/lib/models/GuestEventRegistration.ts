import mongoose, { Schema, Document, Model } from "mongoose";
import { ObjectId } from "mongodb";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GuestRegistrationStatus = "registered" | "checked-in" | "cancelled";

export interface IGuestEventRegistration {
  // Guest Identity
  fullName: {
    firstname: string;
    lastname: string;
  };
  email: string;
  phone?: {
    countryCode: number;
    phoneNumber: number;
  };

  // Event Reference
  eventId: mongoose.Types.ObjectId;
  ticketTypeId: mongoose.Types.ObjectId;

  // Ticket
  inviteCode: string;
  referralCodeUsed: string | null;
  attendanceType?: "physical" | "virtual";
  selectedSkills?: string[];

  // OTP Verification (temporary fields — cleared on verification)
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;
  verifiedAt?: Date;

  // Status
  status: GuestRegistrationStatus;
  registeredAt: Date;
  checkedInAt?: Date;

  // Explicit type flag — always "Guest"
  registrationType: "Guest";

  // Reminder tracking
  reminders?: {
    sent24h?: Date;
    sent1h?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface IGuestEventRegistrationDocument
  extends IGuestEventRegistration, Document {}

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const GuestEventRegistrationSchema =
  new Schema<IGuestEventRegistrationDocument>(
    {
      // ── Guest Identity ──────────────────────────────────────────────────────
      fullName: {
        firstname: {
          type: String,
          required: [true, "First name is required"],
          trim: true,
        },
        lastname: {
          type: String,
          required: [true, "Last name is required"],
          trim: true,
        },
      },

      email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
      },

      phone: {
        countryCode: { type: Number },
        phoneNumber: { type: Number },
      },

      // ── Event Reference ─────────────────────────────────────────────────────
      eventId: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: [true, "Event ID is required"],
      },

      ticketTypeId: {
        type: Schema.Types.ObjectId,
        ref: "TicketType",
        required: [true, "Ticket type ID is required"],
      },

      // ── Ticket ──────────────────────────────────────────────────────────────
      inviteCode: {
        type: String,
        required: [true, "Invite code is required"],
        unique: true,
      },

      referralCodeUsed: {
        type: String,
        default: null,
      },
      attendanceType: {
        type: String,
        enum: ["physical", "virtual"],
        required: false,
      },
      selectedSkills: {
        type: [String],
        default: [],
      },

      // ── OTP Verification ────────────────────────────────────────────────────
      // These fields are cleared after successful verification.
      emailVerificationCode: {
        type: String,
        select: false, // Never returned in queries unless explicitly selected
      },

      emailVerificationExpires: {
        type: Date,
      },

      verifiedAt: {
        type: Date,
      },

      // ── Status ──────────────────────────────────────────────────────────────
      status: {
        type: String,
        enum: ["registered", "checked-in", "cancelled"],
        default: "registered",
      },

      registeredAt: {
        type: Date,
        default: () => new Date(),
      },

      checkedInAt: {
        type: Date,
      },

      // ── Type Flag ───────────────────────────────────────────────────────────
      registrationType: {
        type: String,
        enum: ["Guest"],
        default: "Guest",
        immutable: true,
      },

      // ── Reminders ───────────────────────────────────────────────────────────
      reminders: {
        sent24h: { type: Date },
        sent1h: { type: Date },
      },
    },
    {
      timestamps: true, // Adds createdAt + updatedAt automatically
      collection: "guestEventRegistrations",
    },
  );

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────────────────────

// UNIQUE: one guest per email per event (prevents duplicate registrations)
GuestEventRegistrationSchema.index(
  { email: 1, eventId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: "cancelled" } },
    name: "unique_guest_email_per_event",
  },
);

// Admin queries: find all guests for an event by status, sorted by date
GuestEventRegistrationSchema.index(
  { eventId: 1, status: 1, registeredAt: -1 },
  { name: "event_status_date" },
);

// OTP verification lookup
GuestEventRegistrationSchema.index(
  { email: 1, emailVerificationCode: 1, emailVerificationExpires: 1 },
  { name: "otp_verification", sparse: true },
);

// Referral code lookup
GuestEventRegistrationSchema.index(
  { inviteCode: 1 },
  { name: "invite_code_lookup" },
);

// TTL index: auto-delete UNVERIFIED guest records after OTP expires
// Only documents with emailVerificationExpires set (i.e. unverified) are affected.
// Verified records have this field $unset, so they are NOT deleted.
GuestEventRegistrationSchema.index(
  { emailVerificationExpires: 1 },
  {
    expireAfterSeconds: 0, // Delete as soon as emailVerificationExpires < now
    name: "otp_ttl_cleanup",
    sparse: true, // Skip documents where field is absent (i.e. verified records)
  },
);

// Capacity checks (eventId + ticketTypeId + status)
GuestEventRegistrationSchema.index(
  { eventId: 1, ticketTypeId: 1, status: 1 },
  { name: "capacity_check" },
);

// ─────────────────────────────────────────────────────────────────────────────
// Model (prevent model re-registration in Next.js hot-reload)
// ─────────────────────────────────────────────────────────────────────────────

const GuestEventRegistration: Model<IGuestEventRegistrationDocument> =
  mongoose.models.GuestEventRegistration ||
  mongoose.model<IGuestEventRegistrationDocument>(
    "GuestEventRegistration",
    GuestEventRegistrationSchema,
  );

export default GuestEventRegistration;
