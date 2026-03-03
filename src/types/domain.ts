// lib/types/domain.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all domain types used across models,
// API routes, and the frontend AuthContext.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Education status ───────────────────────────────────────────────────────
export type EduStatus = "STUDENT" | "GRADUATE";

// ── 2. Platform role ──────────────────────────────────────────────────────────
// Lives in Vault (source of truth) + mirrored to UserData (display).
// Default at signup = "participant". Elevated by admin/webmaster only.
export type AccountRole = "participant" | "moderator" | "admin" | "webmaster";

// ── 3. Committee ─────────────────────────────────────────────────────────────
// One committee per user. null = not yet assigned.
export type Committee =
  | "socials"
  | "media"
  | "logistics"
  | "innovation"
  | "mentorship"
  | "protocol";

// ── 4. Skills ────────────────────────────────────────────────────────────────
// Multiple skills per user.
export type Skill =
  | "photography"
  | "design"
  | "electronics"
  | "fashion"
  | "tech"
  | "programming";

// ── 5. Phone number ───────────────────────────────────────────────────────────
// Lives in Vault (source of truth for auth) + mirrored to UserData (display).
// countryCode: numeric dial code e.g. 234 for Nigeria, 1 for USA
// phoneNumber: local number without leading zero e.g. 8012345678
export interface PhoneNumber {
  countryCode: number;
  phoneNumber: number;
}

// ── Convenience arrays (for validation & UI dropdowns) ───────────────────────

export const EDU_STATUSES: EduStatus[] = ["STUDENT", "GRADUATE"];

export const ACCOUNT_ROLES: AccountRole[] = [
  "participant",
  "moderator",
  "admin",
  "webmaster",
];

export const COMMITTEES: Committee[] = [
  "socials",
  "media",
  "logistics",
  "innovation",
  "mentorship",
  "protocol",
];

export const SKILLS: Skill[] = [
  "photography",
  "design",
  "electronics",
  "fashion",
  "tech",
  "programming",
];