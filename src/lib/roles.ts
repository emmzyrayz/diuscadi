// src/lib/roles.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central role constants and helper functions.
// Import from here instead of hardcoding role strings across routes/pages.
//
// Platform roles (stored on vault.role, mirrored to UserData.role, carried in JWT):
//   "participant" — signed-up user. Membership is NOT a separate role — it's
//                    this same role combined with UserData.membershipStatus === "approved".
//   "moderator"   — read-only admin access + ticket scanning + evaluation
//   "admin"       — full admin access, cannot change platform config
//   "webmaster"   — superuser, full access including platform config
//
// Source of truth for this union is AccountRole in types/domain.ts — do not
// redefine the union here, import it, so the two can never drift apart again.
//
// Committee roles (stored on userData.committeeMembership.role) are SEPARATE:
//   "MEMBER", "MOD", "COORDINATOR", "HEAD" (or DB-driven slugs — see domain.ts)
// Do not mix platform roles and committee roles in the same check. Note the
// committee role "MOD" is a different concept from the platform role "moderator"
// despite the similar name — a user's committee role has no bearing on whether
// they have platform-level moderator access.
// ─────────────────────────────────────────────────────────────────────────────

import type { AccountRole } from "@/types/domain";

// ─── Type ─────────────────────────────────────────────────────────────────────

export type PlatformRole = AccountRole;

// ─── Role sets ────────────────────────────────────────────────────────────────

/** Full system admins — can create, edit, delete anything */
export const SYSTEM_ADMIN_ROLES = ["admin", "webmaster"] as const;

/** Moderators — read-only admin access + evaluation + ticket scanning */
export const MOD_ROLES = ["moderator"] as const;

/** Everyone with any admin panel access (system admins + moderators) */
export const ADMIN_PANEL_ROLES = [...SYSTEM_ADMIN_ROLES, ...MOD_ROLES] as const;

/** Roles that can evaluate task assignments */
export const EVALUATOR_ROLES = [...SYSTEM_ADMIN_ROLES, ...MOD_ROLES] as const;

/** Roles that can scan/check-in event tickets */
export const CHECKIN_ROLES = [...SYSTEM_ADMIN_ROLES, ...MOD_ROLES] as const;

/** Roles that can approve global tasks (not moderator — approval is a system admin action) */
export const APPROVER_ROLES = [...SYSTEM_ADMIN_ROLES] as const;

/** Roles that can mutate (create/edit/delete) resources */
export const MUTATOR_ROLES = [...SYSTEM_ADMIN_ROLES] as const;

// ─── Helper functions ─────────────────────────────────────────────────────────

/** True if the role has full system admin access (admin or webmaster) */
export function isSystemAdmin(role: string): boolean {
  return (SYSTEM_ADMIN_ROLES as readonly string[]).includes(role);
}

/** True if the role has moderator access */
export function isModerator(role: string): boolean {
  return role === "moderator";
}

/** True if the role can access the admin panel at all (read-only or full) */
export function canAccessAdminPanel(role: string): boolean {
  return (ADMIN_PANEL_ROLES as readonly string[]).includes(role);
}

/** True if the role can evaluate task assignments */
export function canEvaluate(role: string): boolean {
  return (EVALUATOR_ROLES as readonly string[]).includes(role);
}

/** True if the role can check in event tickets */
export function canCheckIn(role: string): boolean {
  return (CHECKIN_ROLES as readonly string[]).includes(role);
}

/** True if the role can mutate resources (create/edit/delete) */
export function canMutate(role: string): boolean {
  return (MUTATOR_ROLES as readonly string[]).includes(role);
}

/** True if the role can approve global tasks */
export function canApprove(role: string): boolean {
  return (APPROVER_ROLES as readonly string[]).includes(role);
}

// ─── Navbar link visibility helpers ───────────────────────────────────────────

/**
 * Given a platform role, returns what console nav links should be visible.
 * "full"     — system admin: sees all console links
 * "readonly" — moderator: sees read-only links only (no create/edit/delete pages)
 * "none"     — participant (member or not): no console links
 */
export function getConsoleLinkAccess(
  role: string,
): "full" | "readonly" | "none" {
  if (isSystemAdmin(role)) return "full";
  if (isModerator(role)) return "readonly";
  return "none";
}

export type ConsoleLinkVisibility = "full" | "readonly";
