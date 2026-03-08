"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type {
  EduStatus,
  AccountRole,
  Committee,
  CommitteeMembership,
  Skill,
  PhoneNumber,
} from "@/types/domain";

// Re-export for consumers (RouteGuard, forms, etc.)
export type { EduStatus, AccountRole, Committee, CommitteeMembership, Skill };

// ─── 1. Types ────────────────────────────────────────────────────────────────

export interface User {
  // From Vault
  id: string;
  email: string;
  phone: PhoneNumber;
  role: AccountRole;
  eduStatus: EduStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isAccountActive: boolean;

  // From UserData
  userDataId: string;
  fullName: string;
  avatar?: string;
  schoolEmail?: string;
  committeeMembership: CommitteeMembership | null;
  skills: Skill[];
  membershipStatus: "pending" | "approved" | "suspended";
  profileCompleted: boolean;
}

export interface SigninCredentials {
  identifier: string; // personal email or phone number
  password: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  eduStatus: EduStatus;
  phone: PhoneNumber;
  avatar?: string;
  schoolEmail?: string;
  skills?: Skill[];
}

export interface AuthError {
  message: string;
  field?: string;
}

/**
 * "pending"         → app just mounted, session check in progress (show splash)
 * "restored"        → valid session found and user is set
 * "unauthenticated" → no session or session expired (show login)
 */
export type SessionStatus = "pending" | "restored" | "unauthenticated";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True only during signin / signup / resetPassword actions — NOT during session restore */
  isLoading: boolean;
  /** Tracks the initial session resolution lifecycle — use this to drive your app-level splash screen */
  sessionStatus: SessionStatus;
  error: AuthError | null;

  signin: (credentials: SigninCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyEmail: (code: string, email: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  verifyResetOtp: (email: string, code: string) => Promise<string>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

// ─── 2. Helpers ──────────────────────────────────────────────────────────────

const TOKEN_KEY = "diuscadi_token";

const storage = {
  get: (key: string): string | null =>
    typeof window === "undefined" ? null : localStorage.getItem(key),
  set: (key: string, value: string): void => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  },
  remove: (key: string): void => {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  },
};

const clearStoredSession = () => storage.remove(TOKEN_KEY);

export const ROLE_REDIRECTS: Record<AccountRole, string> = {
  participant: "/home",
  moderator: "/home",
  admin: "/admin",
  webmaster: "/admin",
};

// ─── 3. API helper ────────────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error ?? data.message ?? "Request failed");
  return data as T;
}

// ─── 4. Map /api/auth/me response → User ─────────────────────────────────────

function parseUserFromMe(
  vault: Record<string, unknown>,
  userData: Record<string, unknown>,
): User {
  return {
    // From Vault
    id: vault._id as string,
    email: vault.email as string,
    phone: vault.phone as PhoneNumber,
    role: vault.role as AccountRole,
    eduStatus: vault.eduStatus as EduStatus,
    isEmailVerified: vault.isEmailVerified as boolean,
    isPhoneVerified: vault.isPhoneVerified as boolean,
    isAccountActive: vault.isAccountActive as boolean,

    // From UserData
    userDataId: userData._id as string,
    fullName: userData.fullName as string,
    avatar: userData.avatar as string | undefined,
    schoolEmail: userData.schoolEmail as string | undefined,
    committeeMembership: (userData.committeeMembership ??
      null) as CommitteeMembership | null,
    skills: (userData.skills ?? []) as Skill[],
    membershipStatus: (userData.membershipStatus ??
      "pending") as User["membershipStatus"],
    profileCompleted: userData.profileCompleted as boolean,
  };
}

// ─── 5. Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── 6. Provider ──────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("pending");
  const [token, setToken] = useState<string | null>(() =>
    storage.get(TOKEN_KEY),
  );
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => setError(null), []);

  // ── Session Restore on Mount ──────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = storage.get(TOKEN_KEY);
      if (!storedToken) {
        setSessionStatus("unauthenticated");
        return;
      }
      try {
        const { vault, userData } = await apiFetch<{
          vault: Record<string, unknown>;
          userData: Record<string, unknown>;
        }>("/api/auth/me", {}, storedToken);

        setUser(parseUserFromMe(vault, userData));
        setToken(storedToken);
        setSessionStatus("restored");
      } catch {
        clearStoredSession();
        setUser(null);
        setToken(null);
        setSessionStatus("unauthenticated");
      }
    };

    restoreSession();
  }, []);

  // ── Signin ────────────────────────────────────────────────────────────────
  const signin = useCallback(
    async (credentials: SigninCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        const data = await res.json();

        if (res.status === 403 && data.verified === false) {
          router.push(data.redirectTo);
          return;
        }
        if (res.status === 429 && data.verified === false) {
          setError({ message: data.error, field: "general" });
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "Sign in failed.");

        const { vault, userData } = await apiFetch<{
          vault: Record<string, unknown>;
          userData: Record<string, unknown>;
        }>("/api/auth/me", {}, data.token);

        const authedUser = parseUserFromMe(vault, userData);
        storage.set(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(authedUser);
        setSessionStatus("restored");
        router.push(ROLE_REDIRECTS[authedUser.role]);
      } catch (err: unknown) {
        setError({
          message: err instanceof Error ? err.message : "Invalid credentials.",
          field: "general",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = useCallback(
    async (data: SignupData) => {
      setIsLoading(true);
      setError(null);
      try {
        if (data.password !== data.confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        await apiFetch("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            eduStatus: data.eduStatus,
            phone: data.phone,
            avatar: data.avatar,
            schoolEmail: data.schoolEmail,
            skills: data.skills,
          }),
        });
        router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
      } catch (err: unknown) {
        setError({
          message:
            err instanceof Error
              ? err.message
              : "Registration failed. Please try again.",
          field: "general",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const storedToken = storage.get(TOKEN_KEY);
    try {
      if (storedToken) {
        await apiFetch("/api/auth/signout", { method: "POST" }, storedToken);
      }
    } catch {
      // Swallow — clear client state regardless
    } finally {
      clearStoredSession();
      setToken(null);
      setUser(null);
      setError(null);
      setSessionStatus("unauthenticated");
      router.push("/auth");
    }
  }, [router]);

  // ── Forgot Password ───────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset email.";
      setError({ message, field: "general" });
      throw err;
    }
  }, []);

  // ── Verify Email (OTP) ────────────────────────────────────────────────────
  const verifyEmail = useCallback(
    async (code: string, email: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await apiFetch("/api/auth/verify", {
          method: "POST",
          body: JSON.stringify({ email, code }),
        });
        router.push("/auth");
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Verification failed. Check your code and try again.";
        setError({ message, field: "general" });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  // ── Resend Verification ───────────────────────────────────────────────────
  const resendVerification = useCallback(async (email: string) => {
    setError(null);
    try {
      await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not resend code.";
      setError({ message, field: "general" });
      throw err;
    }
  }, []);

  // ── Verify Reset OTP ──────────────────────────────────────────────────────
  const verifyResetOtp = useCallback(
    async (email: string, code: string): Promise<string> => {
      setError(null);
      try {
        const { resetToken } = await apiFetch<{ resetToken: string }>(
          "/api/auth/verify-reset",
          { method: "POST", body: JSON.stringify({ email, code }) },
        );
        return resetToken;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Invalid or expired code.";
        setError({ message, field: "general" });
        throw err;
      }
    },
    [],
  );

  // ── Reset Password ────────────────────────────────────────────────────────
  const resetPassword = useCallback(
    async (resetToken: string, newPassword: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await apiFetch("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ resetToken, newPassword }),
        });
        router.push("/auth");
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Password reset failed. Try requesting a new link.";
        setError({ message, field: "general" });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  // ── Provider value ────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        sessionStatus,
        error,
        signin,
        signup,
        logout,
        forgotPassword,
        verifyEmail,
        resendVerification,
        verifyResetOtp,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── 7. Hook ──────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
};