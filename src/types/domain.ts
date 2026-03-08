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
