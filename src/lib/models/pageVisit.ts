// lib/models/pageVisit.ts
// Lightweight visit document — one per user+page per 3hr window.
// Used to build hourly activity distribution for analytics heatmap prediction.

import { ObjectId } from "mongodb";

export interface PageVisitDocument {
  _id?: ObjectId;
  page: string; // pathname e.g. "/events", "/home"
  hour: number; // 0–23 WAT
  dayOfWeek: number; // 0=Sun … 6=Sat
  userId: string | null; // null for unauthenticated visitors
  sessionKey: string; // hash of userId+page+3hr bucket — uniqueness key
  timestamp: Date;
  expiresAt: Date; // TTL index — auto-delete after 90 days
}
