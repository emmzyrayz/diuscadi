// lib/models/Application.ts

import { ObjectId } from "mongodb";

export type ApplicationType =
  | "membership" // participant → approved member (sets membershipStatus)
  | "committee" // join a committee
  | "skills" // add skills + professional verification
  | "sponsorship" // sponsor an event (stub — fulfilled when sponsorship system built)
  | "program" // expert in a career path/program (stub)
  | "writer"; // blog contributor (stub — fulfilled when blog system built)

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ApplicationDocument {
  _id?: ObjectId;
  userId: ObjectId; // → UserData._id
  vaultId: ObjectId; // → Vault._id

  type: ApplicationType;
  status: ApplicationStatus;

  // ── Type-specific payloads ─────────────────────────────────────────────────

  // committee
  requestedCommittee?: string; // committee slug

  // skills
  requestedSkills?: string[]; // skill slugs

  // membership — no extra payload needed, just reason

  // sponsorship
  sponsorshipDetails?: {
    companyName?: string;
    website?: string;
    eventIds?: string[]; // specific events or open offer
    tier?: string; // e.g. "gold", "silver", "bronze"
  };

  // program / career path
  requestedProgram?: string; // program slug
  expertiseProof?: string; // free-text or URL to evidence

  // writer
  writingSamples?: string[]; // URLs to writing samples
  topics?: string[]; // topics they'd cover

  // ── Shared ────────────────────────────────────────────────────────────────
  reason?: string;

  // ── Review ────────────────────────────────────────────────────────────────
  reviewedBy?: ObjectId;
  reviewNote?: string;
  reviewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
