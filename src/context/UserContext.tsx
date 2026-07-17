"use client";
// src/context/UserContext.tsx
// Unified Phase 5 Hydration: Retains all original methods, locations, & preferences
// while integrating the points and referral schema additions safely.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/authFetch";
import type {
  EduStatus,
  AccountRole,
  Committee,
  CommitteeMembership,
  Skill,
  PhoneNumber,
  UserPreferences,
} from "@/types/domain";
import { DEFAULT_PREFERENCES } from "@/types/domain";
import type { CloudinaryImage } from "@/types/cloudinary";

// ─── Sub-types ────────────────────────────────────────────────────────────────

export interface UserPoints {
  current: number;
  lifetime: number;
  lastCreditedAt?: string | null;
}

export interface UserReferralMeta {
  directCount: number;
  indirectCount: number;
  totalEarned: number;
  treeDepthReached: number;
  lastReferralAt?: string | null;
}

export interface Institution {
  institutionId?: string;
  name?: string;
  abbreviation?: string;
  Type?: "University" | "Polytechnic" | "College" | "Institute";
  facultyId?: string;
  faculty?: string;
  departmentId?: string;
  department?: string;
  degreeType?: string;
  durationYears?: { min: number; max: number };
  level?: string;
  semester?: "First" | "Second";
  enrollmentYear?: number;
  graduationYear?: number;
  currentStatus?: "Graduate" | "Student";
  schoolEmail?: string;
  verifiedSchoolEmail?: boolean;
  cgpa?: number | null;
  cgpaScale?: number;
}

export interface UserLocation {
  country?: string;
  state?: string;
  city?: string;
  lga?: string;
  pendingVerification?: boolean;
  rawCountry?: string;
  rawState?: string;
  rawCity?: string;
}

export interface TemporaryAssignment {
  committee: string;
  role: string;
  endsAt: string;
  originalCommittee: string | null;
  originalRole: string | null;
}

// ─── UserProfile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  fullName: { firstname: string; secondname?: string; lastname: string };
  email: string;
  phone?: PhoneNumber;
  role: AccountRole;
  eduStatus: EduStatus;
  hasAvatar: boolean;
  avatar?: CloudinaryImage;
  socials?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
  committeeMembership: CommitteeMembership | null;
  temporaryAssignment?: TemporaryAssignment;
  skills: Skill[];
  profileCompleted: boolean;
  membershipStatus: "pending" | "approved" | "suspended";
  location?: UserLocation;
  Institution?: Institution;
  profile?: { bio?: string };
  analytics: {
    eventsRegistered: number;
    eventsAttended: number;
    lastEventRegisteredAt?: string;
    lastActiveAt?: string;
  };
  signupInviteCode: string;
  referredBy?: string | null; // invite code of the user who referred this user
  preferences: UserPreferences;

  // ── Phase 5 additions ──
  points?: UserPoints;
  referralMeta?: UserReferralMeta;

  createdAt: string;
  updatedAt: string;
}

export interface UpdateResult {
  success: boolean;
  error?: string;
}

// ─── Context Type ─────────────────────────────────────────────────────────────

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean; // Retained original loading key name
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfileLocal: (patch: Partial<UserProfile>) => void;
  updateProfile: (data: {
    fullName?: { firstname: string; secondname?: string; lastname: string };
    bio?: string;
    phone?: PhoneNumber;
    location?: UserLocation;
    socials?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      portfolio?: string;
    };
  }) => Promise<UpdateResult>;
  updateInstitution: (data: Partial<Institution>) => Promise<UpdateResult>;
  updateSkills: (skills: Skill[]) => Promise<UpdateResult>;
  updateCommittee: (committee: Committee | null) => Promise<UpdateResult>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<UpdateResult>;
  effectiveCommittee: string | null;
  effectiveRole: string | null;
  clearError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | undefined>(undefined);

// ─── Parsing Helpers ──────────────────────────────────────────────────────────

function parseFullName(raw: unknown): UserProfile["fullName"] {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      firstname: String(obj.firstname ?? ""),
      secondname: obj.secondname != null ? String(obj.secondname) : undefined,
      lastname: String(obj.lastname ?? ""),
    };
  }
  return { firstname: String(raw ?? ""), lastname: "" };
}

// ─── Safe Profile Parser Engine ───────────────────────────────────────────────

function parseProfile(raw: Record<string, unknown>): UserProfile {
  const rawPoints = raw.points as Record<string, unknown> | undefined;
  const rawRef = raw.referralMeta as Record<string, unknown> | undefined;

  return {
    id: String(raw._id ?? ""),
    fullName: parseFullName(raw.fullName),
    email: String(raw.email ?? ""),
    hasAvatar: Boolean(raw.hasAvatar),
    avatar: raw.avatar as CloudinaryImage | undefined,
    phone: raw.phone as PhoneNumber | undefined,
    socials: raw.socials as UserProfile["socials"],
    role: (raw.role ?? "participant") as AccountRole,
    eduStatus: (raw.eduStatus ?? "STUDENT") as EduStatus,
    committeeMembership: (raw.committeeMembership ??
      null) as CommitteeMembership | null,
    skills: (raw.skills ?? []) as Skill[],
    profileCompleted: Boolean(raw.profileCompleted),
    membershipStatus: (raw.membershipStatus ??
      "pending") as UserProfile["membershipStatus"],
    location: raw.location as UserLocation | undefined,
    Institution: raw.Institution as Institution | undefined,
    profile: raw.profile as UserProfile["profile"],
    analytics: (raw.analytics ?? {
      eventsRegistered: 0,
      eventsAttended: 0,
    }) as UserProfile["analytics"],
    signupInviteCode: String(raw.signupInviteCode ?? ""),
    referredBy: (raw.referredBy as string | null | undefined) ?? null,

    // Crucial fix: Ensures layout contexts don't drop user configuration
    preferences:
      (raw.preferences as UserPreferences | undefined) ?? DEFAULT_PREFERENCES,

    // Phase 5 Payload Hydration
    points: rawPoints
      ? {
          current: Number(rawPoints.current ?? 0),
          lifetime: Number(rawPoints.lifetime ?? 0),
          lastCreditedAt: rawPoints.lastCreditedAt
            ? String(rawPoints.lastCreditedAt)
            : null,
        }
      : undefined,

    referralMeta: rawRef
      ? {
          directCount: Number(rawRef.directCount ?? 0),
          indirectCount: Number(rawRef.indirectCount ?? 0),
          totalEarned: Number(rawRef.totalEarned ?? 0),
          treeDepthReached: Number(rawRef.treeDepthReached ?? 0),
          lastReferralAt: rawRef.lastReferralAt
            ? String(rawRef.lastReferralAt)
            : null,
        }
      : undefined,

    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

async function callPatch(
  endpoint: string,
  body: Record<string, unknown>,
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<UpdateResult> {
  setIsLoading(true);
  setError(null);
  try {
    const data = await authFetch<{ profile: Record<string, unknown> }>(
      endpoint,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
    setProfile(parseProfile(data.profile));
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Update failed";
    setError(msg);
    return { success: false, error: msg };
  } finally {
    setIsLoading(false);
  }
}

// ─── Provider Component ───────────────────────────────────────────────────────

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, sessionStatus } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed baseline properties from AuthContext immediately on login
  useEffect(() => {
    if (sessionStatus === "pending") return;
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }
    setProfile({
      id: user.userDataId ?? "",
      fullName: parseFullName(user.fullName),
      email: user.email ?? "",
      hasAvatar: user.hasAvatar ?? false,
      avatar: user.avatar as CloudinaryImage | undefined,
      phone: user.phone,
      role: user.role,
      eduStatus: user.eduStatus,
      committeeMembership: user.committeeMembership ?? null,
      skills: user.skills ?? [],
      profileCompleted: user.profileCompleted ?? false,
      membershipStatus: user.membershipStatus ?? "pending",
      location: undefined,
      Institution: undefined,
      profile: undefined,
      analytics: { eventsRegistered: 0, eventsAttended: 0 },
      signupInviteCode: "",
      preferences: user.preferences ?? DEFAULT_PREFERENCES,
      points: user.points
        ? {
            lifetime: user.points.lifetime,
            current: user.points.current ?? 0, // Fallback undefined to 0
          }
        : undefined,
      createdAt: "",
      updatedAt: "",
    });
  }, [isAuthenticated, sessionStatus, user]);

  // Handle deep fetching of heavy profiles when sessions complete verification
  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await authFetch<{ profile: Record<string, unknown> }>(
        "/api/users/profile",
      );
      setProfile(parseProfile(data.profile));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (sessionStatus !== "restored" || !isAuthenticated) return;
    refreshProfile();
  }, [sessionStatus, isAuthenticated, refreshProfile]);

  // ── Core Domain Update Handlers ─────────────────────────────────────────────

  const updateProfile = useCallback(
    (data: {
      fullName?: { firstname: string; secondname?: string; lastname: string };
      bio?: string;
      phone?: PhoneNumber;
      location?: UserLocation;
      socials?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
        portfolio?: string;
      };
    }) =>
      callPatch(
        "/api/users/profile",
        data as Record<string, unknown>,
        setProfile,
        setError,
        setIsLoading,
      ),
    [],
  );

  const updateInstitution = useCallback(
    (data: Partial<Institution>) =>
      callPatch(
        "/api/users/institution",
        data as Record<string, unknown>,
        setProfile,
        setError,
        setIsLoading,
      ),
    [],
  );

  const updateSkills = useCallback(
    (skills: Skill[]) =>
      callPatch(
        "/api/users/skills",
        { skills },
        setProfile,
        setError,
        setIsLoading,
      ),
    [],
  );

  const updateCommittee = useCallback(
    (committee: Committee | null) =>
      callPatch(
        "/api/users/committee",
        { committee },
        setProfile,
        setError,
        setIsLoading,
      ),
    [],
  );

  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>): Promise<UpdateResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await authFetch<{ preferences: UserPreferences }>(
          "/api/users/preferences",
          {
            method: "PATCH",
            body: JSON.stringify(prefs),
          },
        );
        setProfile((prev) =>
          prev ? { ...prev, preferences: data.preferences } : prev,
        );
        return { success: true };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to update preferences";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateProfileLocal = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const effectiveCommittee = profile
    ? ((profile.temporaryAssignment &&
      new Date(profile.temporaryAssignment.endsAt) > new Date()
        ? profile.temporaryAssignment.committee
        : profile.committeeMembership?.committee) ?? null)
    : null;

  const effectiveRole = profile
    ? ((profile.temporaryAssignment &&
      new Date(profile.temporaryAssignment.endsAt) > new Date()
        ? profile.temporaryAssignment.role
        : profile.committeeMembership?.role) ?? null)
    : null;

  const clearError = useCallback(() => setError(null), []);

  return (
    <UserContext.Provider
      value={{
        profile,
        isLoading,
        error,
        refreshProfile,
        updateProfile,
        updateInstitution,
        updateSkills,
        updateCommittee,
        updateProfileLocal,
        updatePreferences,
        effectiveCommittee,
        effectiveRole,
        clearError,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};
