"use client";
// context/UserContext.tsx
//
// Owns the full UserData profile for the authenticated user.
// Auth state (JWT, session, role) lives in AuthContext — this context
// manages platform profile data only.
//
// Data flow:
//   1. Mount        → seed from AuthContext.user (populated by /api/auth/me)
//                     Gives the UI instant basic data with zero extra fetches.
//   2. Profile page → call refreshProfile() to load Institution, bio, analytics
//                     from GET /api/users/profile
//   3. Updates      → dedicated methods each calling their own endpoint:
//                     updateProfile()     → PATCH /api/users/profile
//                     updateInstitution() → PATCH /api/users/institution
//                     updateSkills()      → PATCH /api/users/skills
//                     updateCommittee()   → PATCH /api/users/committee

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import type {
  EduStatus,
  AccountRole,
  Committee,
  Skill,
  PhoneNumber,
} from "@/types/domain";

// ─── Types ────────────────────────────────────────────────────────────────────
// Mirrors UserDataDocument with string _id (ObjectId is not serialisable).

export interface Institution {
  Type?: "University" | "Polytechnic";
  name?: string;
  department?: string;
  faculty?: string;
  level?: string;
  semester?: "First" | "Second";
  graduationYear?: number;
  currentStatus?: string;
}

export interface UserProfile {
  id: string; // UserData._id stringified
  fullName: string;
  email: string;
  avatar?: string;
  phone?: PhoneNumber; // { countryCode: number, phoneNumber: number }
  schoolEmail?: string;
  role: AccountRole; // "participant" | "moderator" | "admin" | "webmaster"
  eduStatus: EduStatus; // "STUDENT" | "GRADUATE"
  committee: Committee | null; // "socials" | "media" | ... | null
  skills: Skill[]; // "photography" | "design" | ...
  profileCompleted: boolean;
  membershipStatus: "pending" | "approved" | "suspended";
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
  Institution?: Institution;
  profile?: {
    bio?: string;
  };
  analytics: {
    eventsRegistered: number;
    eventsAttended: number;
    lastEventRegisteredAt?: string;
  };
  signupInviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateResult {
  success: boolean;
  error?: string;
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Fetches full document from GET /api/users/profile
  // (Institution, bio, analytics not included in the auth/me seed)
  refreshProfile: () => Promise<void>;

  // PATCH /api/users/profile — fullName, avatar, bio, phone
  updateProfile: (data: {
    fullName?: string;
    avatar?: string;
    bio?: string;
    phone?: PhoneNumber;
  }) => Promise<UpdateResult>;

  // PATCH /api/users/institution
  updateInstitution: (data: Partial<Institution>) => Promise<UpdateResult>;

  // PATCH /api/users/skills
  // Valid: "photography" | "design" | "electronics" | "fashion" | "tech" | "programming"
  updateSkills: (skills: Skill[]) => Promise<UpdateResult>;

  // PATCH /api/users/committee
  // Valid: "socials" | "media" | "logistics" | "innovation" | "mentorship" | "protocol" | null
  updateCommittee: (committee: Committee | null) => Promise<UpdateResult>;

  clearError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | undefined>(undefined);

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Converts raw API response (MongoDB doc with stringified _id) → UserProfile
function parseProfile(raw: Record<string, unknown>): UserProfile {
  return {
    id: String(raw._id ?? ""),
    fullName: String(raw.fullName ?? ""),
    email: String(raw.email ?? ""),
    avatar: raw.avatar as string | undefined,
    phone: raw.phone as PhoneNumber | undefined,
    schoolEmail: raw.schoolEmail as string | undefined,
    role: (raw.role ?? "participant") as AccountRole,
    eduStatus: (raw.eduStatus ?? "STUDENT") as EduStatus,
    committee: (raw.committee ?? null) as Committee | null,
    skills: (raw.skills ?? []) as Skill[],
    profileCompleted: Boolean(raw.profileCompleted),
    membershipStatus: (raw.membershipStatus ??
      "pending") as UserProfile["membershipStatus"],
    location: raw.location as UserProfile["location"],
    Institution: raw.Institution as Institution | undefined,
    profile: raw.profile as UserProfile["profile"],
    analytics: (raw.analytics ?? {
      eventsRegistered: 0,
      eventsAttended: 0,
    }) as UserProfile["analytics"],
    signupInviteCode: String(raw.signupInviteCode ?? ""),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

// Generic PATCH helper — calls endpoint, updates state on success
async function callPatch(
  endpoint: string,
  body: Record<string, unknown>,
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<UpdateResult> {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const msg = String(data.error ?? "Update failed");
      setError(msg);
      return { success: false, error: msg };
    }
    // Every PATCH route returns { message, profile: sanitizedUserData }
    setProfile(parseProfile(data.profile as Record<string, unknown>));
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Update failed";
    setError(msg);
    return { success: false, error: msg };
  } finally {
    setLoading(false);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, sessionStatus } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: seed from AuthContext on login ────────────────────────────────
  // /api/auth/me returns the fields below — use them immediately so the
  // UI is populated without waiting for an extra network call.
  // Institution, bio, full analytics are loaded lazily via refreshProfile().
  useEffect(() => {
    if (sessionStatus === "pending") return;

    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }

    setProfile({
      id: user.userDataId ?? "",
      fullName: user.fullName ?? "",
      email: user.email ?? "",
      avatar: user.avatar,
      phone: user.phone,
      schoolEmail: user.schoolEmail,
      role: user.role,
      eduStatus: user.eduStatus,
      committee: user.committee ?? null,
      skills: user.skills ?? [],
      profileCompleted: user.profileCompleted ?? false,
      membershipStatus: user.membershipStatus ?? "pending",
      location: undefined,
      Institution: undefined,
      profile: undefined,
      analytics: { eventsRegistered: 0, eventsAttended: 0 },
      signupInviteCode: "",
      createdAt: "",
      updatedAt: "",
    });
  }, [isAuthenticated, sessionStatus, user]);

  // ── Step 2: refreshProfile → GET /api/users/profile ──────────────────────
  // Call this on profile pages or any page that needs Institution / bio.
  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/profile", { headers: authHeaders() });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok)
        throw new Error(String(data.error ?? "Failed to load profile"));
      setProfile(parseProfile(data.profile as Record<string, unknown>));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // ── updateProfile → PATCH /api/users/profile ─────────────────────────────
  const updateProfile = useCallback(
    (data: {
      fullName?: string;
      avatar?: string;
      bio?: string;
      phone?: PhoneNumber;
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

  // ── updateInstitution → PATCH /api/users/institution ─────────────────────
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

  // ── updateSkills → PATCH /api/users/skills ────────────────────────────────
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

  // ── updateCommittee → PATCH /api/users/committee ──────────────────────────
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
        clearError,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};
