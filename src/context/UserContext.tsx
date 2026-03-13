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
//                     updateCommittee()   → PATCH /api/users/committee (leave only)

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
  CommitteeMembership,
  Skill,
  PhoneNumber,
  UserPreferences,
} from "@/types/domain";
import { DEFAULT_PREFERENCES } from "@/types/domain";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  phone?: PhoneNumber;
  schoolEmail?: string;
  role: AccountRole;
  eduStatus: EduStatus;

  // Single committee membership — null = not in any committee yet
  committeeMembership: CommitteeMembership | null;

  skills: Skill[];
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
  preferences: UserPreferences;
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

  refreshProfile: () => Promise<void>;
  updateProfile: (data: {
    fullName?: string;
    avatar?: string;
    bio?: string;
    phone?: PhoneNumber;
  }) => Promise<UpdateResult>;
  updateInstitution: (data: Partial<Institution>) => Promise<UpdateResult>;
  updateSkills: (skills: Skill[]) => Promise<UpdateResult>;
  // Only supports leaving (null) — joining requires POST /api/applications
  updateCommittee: (committee: Committee | null) => Promise<UpdateResult>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<UpdateResult>;
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
    committeeMembership: (raw.committeeMembership ??
      null) as CommitteeMembership | null,
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
    preferences:
      (raw.preferences as UserPreferences | undefined) ?? DEFAULT_PREFERENCES,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

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
      committeeMembership: user.committeeMembership ?? null,
      skills: user.skills ?? [],
      profileCompleted: user.profileCompleted ?? false,
      membershipStatus: user.membershipStatus ?? "pending",
      location: undefined,
      Institution: undefined,
      profile: undefined,
      analytics: { eventsRegistered: 0, eventsAttended: 0 },
      signupInviteCode: "",
      preferences: user.preferences, // ← from AuthContext.user, populated by /api/auth/me
      createdAt: "",
      updatedAt: "",
    });
  }, [isAuthenticated, sessionStatus, user]);

  // ── Step 2: refreshProfile → GET /api/users/profile ──────────────────────
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

  // ── Step 2b: auto-fetch full profile on mount ────────────────────────────
  // Runs once when sessionStatus becomes "restored" (i.e. auth check done).
  // Populates preferences, Institution, analytics etc. across ALL pages so
  // ThemeProvider always has the real theme — no page needs to call
  // refreshProfile() manually just to get the correct accent/mode.
  useEffect(() => {
    if (sessionStatus !== "restored" || !isAuthenticated) return;
    refreshProfile();
  }, [sessionStatus, isAuthenticated, refreshProfile]);

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

  // Only supports leaving (null). Joining requires POST /api/applications.
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
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("diuscadi_token")
            : null;
        const res = await fetch("/api/users/preferences", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(prefs),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to update preferences");
          return { success: false, error: data.error };
        }
        // Merge the returned preferences back into profile
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
        updatePreferences,
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
