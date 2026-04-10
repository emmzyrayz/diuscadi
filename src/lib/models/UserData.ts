// lib/models/UserData.ts — updated Institution subdoc + location split
import { ObjectId } from "mongodb";
import { CloudinaryImage } from "@/types/cloudinary";
import { SemesterGPARecord } from "@/types/academic";
import {
  EduStatus,
  AccountRole,
  Committee,
  CommitteeMembership,
  Skill,
  PhoneNumber,
  UserPreferences,
} from "@/types/domain";

export type {
  EduStatus,
  AccountRole,
  Committee,
  CommitteeMembership,
  Skill,
  PhoneNumber,
  UserPreferences,
};

// ── Location ──────────────────────────────────────────────────────────────────
// Stored as three separate fields for proper filtering/indexing.
// "Other" entries are flagged as pendingVerification until admin approves.
export interface UserLocation {
  country?: string;
  state?: string;
  city?: string; // city or LGA
  lga?: string; // Local Government Area (Nigeria-specific)

  // Set when user chose "Other" for any field — triggers admin verification queue
  pendingVerification?: boolean;
  // Raw values typed by user before admin approval
  rawCountry?: string;
  rawState?: string;
  rawCity?: string;
}

export interface UserDataDocument {
  _id?: ObjectId;
  vaultId: ObjectId;

  // ── Identity ──────────────────────────────────────────────────────────────
  fullName: { firstname: string; secondname?: string; lastname: string };
  email: string;

  // ── Avatar ────────────────────────────────────────────────────────────────
  hasAvatar: boolean;
  avatar?: CloudinaryImage;

  // ── Phone ─────────────────────────────────────────────────────────────────
  phone: PhoneNumber;

  // ── Location (three separate fields) ─────────────────────────────────────
  location?: UserLocation;

  // ── Role ──────────────────────────────────────────────────────────────────
  role: AccountRole;
  eduStatus: EduStatus;

  // ── Institution ───────────────────────────────────────────────────────────
  Institution?: {
    // ObjectId refs + denormalised names for display without joins
    institutionId?: ObjectId; // → Institution._id
    name?: string; // denormalised: Institution.name
    abbreviation?: string; // denormalised: Institution.abbreviation
    Type?: "University" | "Polytechnic" | "College" | "Institute";

    facultyId?: ObjectId; // → Faculty._id
    faculty?: string; // denormalised: Faculty.name

    departmentId?: ObjectId; // → Department._id
    department?: string; // denormalised: Department.name

    // From InstitutionDepartment junction — stored for fast display
    degreeType?: string; // e.g. "B.Sc", "ND"
    durationYears?: { min: number; max: number };

    semester?: "First" | "Second";

    // ── Level ─────────────────────────────────────────────────────────────
    // Display convenience e.g. "300", "ND2"
    // Options are constrained by durationYears.max at selection time.
    // Do NOT store "300 Level" — store the raw value "300" and format in UI.
    level?: string;

    enrollmentYear?: number;
    graduationYear?: number;
    currentStatus?: "Graduate" | "Student";

    // ── School email ──────────────────────────────────────────────────────
    schoolEmail?: string;
    verifiedSchoolEmail: boolean;
    RegistrationNumber?: string;

    // ── Academic record ───────────────────────────────────────────────────
    gpaRecord: SemesterGPARecord[];
    cgpa: number | null;
    cgpaLastCalculatedAt?: string;
  };

  // ── Socials ───────────────────────────────────────────────────────────────
  socials?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };

  committeeMembership: CommitteeMembership | null;
  skills: Skill[];
  profileCompleted: boolean;
  profile?: { bio?: string };
  membershipStatus: "pending" | "approved" | "suspended";
  signupInviteCode: string;
  referredBy?: ObjectId;

  analytics: {
    eventsRegistered: number;
    eventsAttended: number;
    lastEventRegisteredAt?: Date;
    lastActiveAt?: Date;
  };

  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
