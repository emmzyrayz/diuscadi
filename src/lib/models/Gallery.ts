import { ObjectId } from "mongodb";

export type GalleryCategory =
  | "event"
  | "meeting"
  | "outing"
  | "conference"
  | "workshop"
  | "celebration";

export type GalleryMediaType = "image" | "video";

export interface GalleryDocument {
  _id?: ObjectId;

  // ── Media ─────────────────────────────────────────────────────────────────
  mediaType: GalleryMediaType;

  // Image fields — required when mediaType === "image"
  imageUrl?: string; // Cloudinary secure_url
  imagePublicId?: string; // Cloudinary public_id — needed for deletion
  imageCloudName?: string; // Cloudinary cloud name — for URL reconstruction

  // Video fields — required when mediaType === "video"
  youtubeId?: string; // Extracted YouTube video ID
  youtubeUrl?: string; // Original URL — kept for data integrity

  // ── Classification ────────────────────────────────────────────────────────
  category: GalleryCategory;
  caption?: string;

  // ── Event link (optional across all categories) ───────────────────────────
  // When set, the public gallery shows a "View Event" button routing to /events/[eventId]
  eventId?: ObjectId;

  // ── Display controls ──────────────────────────────────────────────────────
  featured: boolean; // pinned to top of gallery
  published: boolean; // false = draft, never shown on public gallery
  order: number; // manual ordering override within category

  // ── Ownership ─────────────────────────────────────────────────────────────
  createdBy: ObjectId; // → Vault._id
  updatedBy?: ObjectId;

  createdAt: Date;
  updatedAt: Date;
}
