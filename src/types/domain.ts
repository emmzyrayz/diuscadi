import { ObjectId } from "mongodb";

export type EduStatus = "STUDENT" | "GRADUATE";
export type AccountRole = "participant" | "moderator" | "admin" | "webmaster";
export type Committee =
  | "socials"
  | "media"
  | "logistics"
  | "innovation"
  | "mentorship"
  | "protocol";
export type Skill =
  | "photography"
  | "design"
  | "electronics"
  | "fashion"
  | "tech"
  | "programming";
export type CommitteeRole = "MEMBER" | "COORDINATOR" | "HEAD" | "ADMIN";

export interface PhoneNumber {
  countryCode: number;
  phoneNumber: number;
}

// A user's single committee membership with an attached role.
// null = not in any committee yet.
export interface CommitteeMembership {
  committee: Committee;
  role: CommitteeRole;
  joinedAt: Date;
  assignedBy?: ObjectId; // → Vault._id of admin who assigned/changed the role
}

// ── User Preferences (persisted on UserDataDocument) ─────────────────────────

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "orange" | "emerald" | "violet" | "rose" | "amber";
export type NotificationFrequency = "instant" | "daily" | "weekly";

export interface NotificationPreferences {
  frequency: NotificationFrequency;
  tickets: boolean; // ticket confirmations & QR codes
  reminders: boolean; // 24h/1h event reminders
  messages: boolean; // direct messages from other members
  marketing: boolean; // news & platform features
}

export interface AppearancePreferences {
  theme: ThemeMode;
  accent: AccentColor;
}

export interface PrivacyPreferences {
  profilePrivate: boolean; // hide from DIUSCADI directory
  showEmail: boolean; // display on digital ID
  showPhone: boolean; // display for networking
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  appearance: AppearancePreferences;
  privacy: PrivacyPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    frequency: "instant",
    tickets: true,
    reminders: true,
    messages: false,
    marketing: false,
  },
  appearance: {
    theme: "light",
    accent: "emerald",
  },
  privacy: {
    profilePrivate: false,
    showEmail: false,
    showPhone: false,
  },
};

export const ACCENT_COLORS: AccentColor[] = [
  "orange",
  "emerald",
  "violet",
  "rose",
  "amber",
];
export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];
export const NOTIF_FREQS: NotificationFrequency[] = [
  "instant",
  "daily",
  "weekly",
];

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
export const COMMITTEE_ROLES: CommitteeRole[] = [
  "MEMBER",
  "COORDINATOR",
  "HEAD",
  "ADMIN",
];
