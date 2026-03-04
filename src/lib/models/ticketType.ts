// lib/models/TicketType.ts
//
// One TicketType per pricing tier per event.
// Free events get a single TicketType with price = 0.
// Multiple tiers (Regular, VIP, Early Bird) are supported via multiple docs.

import { ObjectId } from "mongodb";

export type Currency = "NGN" | "USD" | "GBP"; // extend as needed

export interface TicketTypeDocument {
  _id?: ObjectId;

  eventId: ObjectId; // → Event._id

  // ── Tier identity ─────────────────────────────────────────────────────────
  name: string; // "Free", "Regular", "VIP", "Early Bird"

  // ── Pricing (payment-ready — set price=0 for free events) ─────────────────
  price: number; // 0 for free
  currency: Currency; // "NGN" default

  // ── Capacity ──────────────────────────────────────────────────────────────
  // slotsRemaining calculated dynamically — not stored.
  maxQuantity: number;

  // ── Early bird window (optional) ──────────────────────────────────────────
  availableFrom?: Date;
  availableUntil?: Date;

  // ── Visibility ────────────────────────────────────────────────────────────
  isActive: boolean; // false = hidden / sold out / expired

  createdAt: Date;
  updatedAt: Date;
}
