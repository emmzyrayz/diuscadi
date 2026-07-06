// src/lib/models/PointsLog.ts
// ─────────────────────────────────────────────────────────────────────────────
// Immutable ledger of every point transaction on the platform.
// Written by the points credit service only — never mutated after insert.
//
// Collections: pointsLog
//
// Sources that write here:
//   "referral_signup"      — someone signed up using this user's invite code
//   "referral_event_reg"   — someone registered for an event using this
//                            user's invite code (discount applied to referee,
//                            bonus credited to referrer)
//   "task_completion"      — a submission task was evaluated and passed
//   "task_poll"            — a poll task was completed (instant)
//   "task_survey"          — a survey task was completed (instant)
//   "task_acknowledgement" — an acknowledgement task was confirmed (instant)
//   "task_learning"        — an external learning platform fired a completion
//                            webhook (TODO: implement when edu platforms ready)
//   "admin_grant"          — manual point grant by admin (with reason)
//   "admin_deduct"         — manual point deduction by admin (with reason)
//   "redemption"           — user redeemed points for a reward (future use)
//
// ─────────────────────────────────────────────────────────────────────────────

import { ObjectId } from "mongodb";

// ── Source type union ─────────────────────────────────────────────────────────

export type PointsLogSource =
  | "referral_signup" // referrer earns bonus when a direct/indirect
  // user they referred completes account creation
  | "referral_event_reg" // referrer earns bonus when a user they referred
  // registers for a paid event using the invite code
  | "task_completion" // submission task evaluated ≥ passing threshold
  | "task_poll" // poll response recorded
  | "task_survey" // survey response recorded
  | "task_acknowledgement" // acknowledgement confirmed
  | "task_learning" // external edu platform webhook (TODO)
  | "admin_grant" // manual admin credit
  | "admin_deduct" // manual admin deduction (amount stored negative)
  | "redemption"; // future: points spent on a reward

// ── Document interface ────────────────────────────────────────────────────────

export interface PointsLogDocument {
  _id?: ObjectId;

  // The user receiving (or losing) points.
  userId: ObjectId; // → userData._id

  // Points credited (+) or debited (−) in this transaction.
  // Always positive for credits; always negative for deductions/redemptions.
  // Stored as a signed integer — makes sum aggregations straightforward.
  amount: number;

  // Cumulative lifetime total AFTER this transaction was applied.
  // Snapshotted at write time so point history can be replayed without
  // re-running the full ledger from scratch.
  lifetimeAfter: number;

  // What triggered this transaction.
  source: PointsLogSource;

  // The document that caused this transaction.
  // For task sources → assignmentId (ObjectId string).
  // For referral sources → the new user's userData._id (ObjectId string).
  // For admin_grant / admin_deduct → free-form reference or "manual".
  // For redemption → reward document id (future).
  sourceId: string;

  // ── Referral-specific fields ──────────────────────────────────────────────
  // Only populated when source starts with "referral_".
  // Null/absent for all other sources.

  // The user who was referred (the one whose signup or registration
  // triggered this reward for the current userId).
  refereeUserId?: ObjectId; // → userData._id of the new user

  // Depth in the referral tree at which this reward was triggered.
  //   1 = direct referral (referee signed up using userId's invite code)
  //   2 = indirect (referee was referred by someone userId referred)
  //   3 = depth-3 indirect
  // Absent / undefined for non-referral sources.
  referralDepth?: 1 | 2 | 3;

  // ── Task-specific fields ──────────────────────────────────────────────────
  // Only populated when source starts with "task_".

  // The task that was completed — stored for admin audit without a join.
  taskId?: ObjectId; // → tasks._id

  // Denormalised task title at the time of completion — so the points log
  // history page can display "Completed: Design Sprint Brief" without
  // fetching the task document (which may have been archived).
  taskTitle?: string;

  // Score earned (0–maxScore) at time of evaluation.
  // Only present for task_completion (submission tasks).
  // Absent for instant-complete types (poll, survey, acknowledgement).
  taskScore?: number;
  taskMaxScore?: number;

  // ── Admin action fields ───────────────────────────────────────────────────
  // Only populated when source is "admin_grant" or "admin_deduct".

  // The admin or webmaster who triggered the manual adjustment.
  grantedBy?: ObjectId; // → Vault._id

  // Human-readable reason recorded at the time of the manual action.
  reason?: string;

  // ── Immutability marker ───────────────────────────────────────────────────
  // All documents are insert-only. This timestamp is the canonical record
  // of when the transaction occurred. No updatedAt — this collection is
  // append-only by design.
  createdAt: Date;
}
