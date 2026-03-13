// lib/models/FileDocument.ts
//
// Represents a stored file — original + processed variants.
// One document per uploaded file.
//
// Design principles:
//   - originalKey is ALWAYS preserved — we never overwrite the user's original.
//   - storageKey   = storage-optimised version (smaller, lossless quality).
//   - webKey       = web-renderable version (HTML for docx/xlsx, PDF for pptx).
//   - variants     = on-demand conversions keyed by format string ("pdf", "html", etc.)
//     This map grows without schema changes — new conversion features just add keys.
//   - processingStatus tracks the async pipeline state.
//
// Attached to entities via a generic attachment system:
//   ownerType: "user" | "event" | "application" | "committee" | "resource"
//   ownerId:   ObjectId of the owning entity
//
// This lets any entity in the platform attach files without per-entity schema changes.

import { ObjectId } from "mongodb";

// ─── Processing pipeline ──────────────────────────────────────────────────────

export type ProcessingStatus =
  | "pending" // uploaded, awaiting processing
  | "processing" // conversion pipeline running
  | "ready" // all variants available
  | "failed" // pipeline error (original still available)
  | "skipped"; // file type needs no processing (e.g. plain .pdf)

// ─── File categories ──────────────────────────────────────────────────────────

export type FileCategory =
  | "document" // .pdf, .docx, .txt, .md
  | "spreadsheet" // .xlsx, .csv
  | "presentation" // .pptx
  | "archive" // .zip, .tar
  | "other";

// ─── Owner types ──────────────────────────────────────────────────────────────

export type FileOwnerType =
  | "user" // user-uploaded (resume, cert, ID doc)
  | "event" // event resource (schedule PDF, slides)
  | "application" // committee application attachment
  | "committee" // committee-shared resources
  | "platform"; // platform-wide resources (webmaster-managed)

// ─── Variant ─────────────────────────────────────────────────────────────────

export interface FileVariant {
  key: string; // B2 object key
  mimeType: string; // MIME of this variant
  sizeBytes: number;
  generatedAt: Date;
}

// ─── Main document ────────────────────────────────────────────────────────────

export interface FileDocument {
  _id?: ObjectId;

  // ── Identity ─────────────────────────────────────────────────────────────
  originalName: string; // original filename from the user's disk
  displayName: string; // sanitized display name
  mimeType: string; // detected MIME of the original
  category: FileCategory;
  sizeBytes: number; // size of the original

  // ── Ownership ─────────────────────────────────────────────────────────────
  ownerType: FileOwnerType;
  ownerId: ObjectId;
  uploadedBy: ObjectId; // → Vault._id of the user who uploaded

  // ── Storage keys (Backblaze B2 object keys) ───────────────────────────────
  // null = not yet generated or not applicable for this file type
  originalKey: string; // always set after upload
  storageKey: string | null; // compressed/optimised for storage
  webKey: string | null; // web-renderable format

  // ── On-demand variants ────────────────────────────────────────────────────
  // Keyed by format string: "pdf", "html", "docx", "xlsx", etc.
  // Populated lazily when a client first requests a given format.
  variants: Record<string, FileVariant>;

  // ── Processing ────────────────────────────────────────────────────────────
  processingStatus: ProcessingStatus;
  processingError?: string; // last pipeline error message
  processingJobId?: string; // for future queue integration

  // ── Access control ────────────────────────────────────────────────────────
  isPublic: boolean; // false = only owner + admin can access
  accessList?: ObjectId[]; // explicit allow-list (optional future feature)

  // ── Metadata ──────────────────────────────────────────────────────────────
  description?: string;
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
}
