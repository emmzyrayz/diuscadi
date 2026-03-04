"use client";
// context/UserContext.tsx
//
// Owns the full UserData profile for the authenticated user.
// AuthContext is the source of truth for authentication + role.
// UserContext reads the initial data from AuthContext (/me response)
// and keeps a local copy that updates optimistically on PATCH.

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

// ─── UserProfile type ─────────────────────────────────────────────────────────
// Mirrors UserDataDocument but with string _id (serialized from ObjectId).

export interface UserProfile {
  id: string; // UserData._id
  vaultId: string; // Vault._id
  fullName: string;
  email: string;
  avatar?: string;
  phone: PhoneNumber;
  schoolEmail?: string;
  role: AccountRole;
  eduStatus: EduStatus;
  committee: Committee | null;
  skills: Skill[];
  profileCompleted: boolean;
  membershipStatus: "pending" | "approved" | "suspended";
  Institution?: {
    Type?: "University" | "Polytechnic";
    name?: string;
    department?: string;
    faculty?: string;
    level?: string;
    semester?: "First" | "Second";
    graduationYear?: number;
    currentStatus?: string;
  };
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

// ─── Section update payloads ──────────────────────────────────────────────────

export type ProfileSection =
  | "identity"
  | "contact"
  | "institution"
  | "skills"
  | "committee"
  | "bio";

export interface UpdateResult {
  success: boolean;
  error?: string;
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Update a section of the profile
  updateProfile: (
    section: ProfileSection,
    data: Record<string, unknown>,
  ) => Promise<UpdateResult>;

  // Submit a committee or skill application
  applyFor: (
    type: "committee" | "skill",
    value: string,
    note?: string,
  ) => Promise<UpdateResult>;

  // Refresh profile from server (after admin changes etc.)
  refreshProfile: () => Promise<void>;

  clearError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseProfile(raw: Record<string, unknown>): UserProfile {
  return {
    id: raw._id as string,
    vaultId: raw.vaultId as string,
    fullName: raw.fullName as string,
    email: raw.email as string,
    avatar: raw.avatar as string | undefined,
    phone: raw.phone as PhoneNumber,
    schoolEmail: raw.schoolEmail as string | undefined,
    role: raw.role as AccountRole,
    eduStatus: raw.eduStatus as EduStatus,
    committee: (raw.committee ?? null) as Committee | null,
    skills: (raw.skills ?? []) as Skill[],
    profileCompleted: raw.profileCompleted as boolean,
    membershipStatus: (raw.membershipStatus ??
      "pending") as UserProfile["membershipStatus"],
    Institution: raw.Institution as UserProfile["Institution"],
    profile: raw.profile as UserProfile["profile"],
    analytics: (raw.analytics ?? {
      eventsRegistered: 0,
      eventsAttended: 0,
    }) as UserProfile["analytics"],
    signupInviteCode: raw.signupInviteCode as string,
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, sessionStatus } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch full profile from /api/user/profile ─────────────────────────────
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("diuscadi_token");
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile.");
      const data = await res.json();
      setProfile(parseProfile(data.userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Seed profile from AuthContext user on auth state change ───────────────
  // AuthContext /me already returns userData — use it to populate immediately
  // without an extra fetch. Then offer refreshProfile for manual re-syncs.
  useEffect(() => {
    if (sessionStatus === "pending") return;

    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }

    // Map AuthContext User → UserProfile (subset — enough for most UI)
    // A full fetch via refreshProfile() loads Institution, bio, analytics, etc.
    setProfile({
      id: user.userDataId,
      vaultId: user.id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      schoolEmail: user.schoolEmail,
      role: user.role,
      eduStatus: user.eduStatus,
      committee: user.committee,
      skills: user.skills,
      profileCompleted: user.profileCompleted,
      membershipStatus: user.membershipStatus,
      analytics: { eventsRegistered: 0, eventsAttended: 0 },
      signupInviteCode: "",
      createdAt: "",
      updatedAt: "",
    });
  }, [isAuthenticated, sessionStatus, user]);

  // ── refreshProfile ────────────────────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  // ── updateProfile ─────────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (
      section: ProfileSection,
      data: Record<string, unknown>,
    ): Promise<UpdateResult> => {
      const token = localStorage.getItem("diuscadi_token");
      if (!token) return { success: false, error: "Not authenticated." };

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ section, data }),
        });

        const json = await res.json();

        if (!res.ok) {
          const msg = json.error ?? "Update failed.";
          setError(msg);
          return { success: false, error: msg };
        }

        // Optimistic update — merge returned userData into local profile
        setProfile(parseProfile(json.userData));
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Update failed.";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── applyFor ──────────────────────────────────────────────────────────────
  const applyFor = useCallback(
    async (
      type: "committee" | "skill",
      value: string,
      note?: string,
    ): Promise<UpdateResult> => {
      const token = localStorage.getItem("diuscadi_token");
      if (!token) return { success: false, error: "Not authenticated." };

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/user/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type, value, note }),
        });

        const json = await res.json();

        if (!res.ok) {
          const msg = json.error ?? "Application failed.";
          setError(msg);
          return { success: false, error: msg };
        }

        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Application failed.";
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
        updateProfile,
        applyFor,
        refreshProfile,
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
  if (!ctx) throw new Error("useUser must be used within a UserProvider.");
  return ctx;
};
