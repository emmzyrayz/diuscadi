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

// ─── 1. Types ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN" | "WEBMASTER";
  avatar?: string;
  isVerified?: boolean;
}

export interface SigninCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  accountType: "STUDENT" | "FACULTY";
}

export interface AuthError {
  message: string;
  field?: keyof SigninCredentials | keyof SignupData | "general";
}

/**
 * "pending"         → app just mounted, session check in progress (show splash)
 * "restored"        → valid session found and user is set
 * "unauthenticated" → no session or session expired (show login)
 */
export type SessionStatus = "pending" | "restored" | "unauthenticated";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** True only during signin / signup / resetPassword actions — NOT during session restore */
  isLoading: boolean;
  /** Tracks the initial session resolution lifecycle — use this to drive your app-level splash screen */
  sessionStatus: SessionStatus;
  error: AuthError | null;

  signin: (credentials: SigninCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  verify: (token: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

// ─── 2. Helpers ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "diuscadi_user";
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

const clearStoredSession = () => {
  storage.remove(STORAGE_KEY);
  storage.remove(TOKEN_KEY);
};

const ROLE_REDIRECTS: Record<User["role"], string> = {
  STUDENT: "/dashboard",
  FACULTY: "/dashboard",
  ADMIN: "/admin/analytics",
  WEBMASTER: "/admin/system",
};

// ─── 3. Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── 4. Provider ──────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // action-level loading only
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("pending");
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => setError(null), []);

  // ── Session Restore on Mount ──────────────────────────────────────────────
  //
  // Flow:
  //   1. Read stored user + token from localStorage (SSR-safe)
  //   2. If either is missing → unauthenticated immediately (no flash)
  //   3. If both exist → hit /api/auth/me to validate the token server-side
  //      so an expired/revoked token never passes isAuthenticated checks
  //   4. On success → restore user, set sessionStatus = "restored"
  //   5. On failure → clear storage, set sessionStatus = "unauthenticated"
  //
  // This runs exactly once on mount. All subsequent auth state changes go
  // through signin / logout / etc., which update sessionStatus themselves.
  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = storage.get(STORAGE_KEY);
      const storedToken = storage.get(TOKEN_KEY);

      if (!storedUser || !storedToken) {
        setSessionStatus("unauthenticated");
        return;
      }

      try {
        // TODO: replace mock with real validation
        // const res = await fetch("/api/auth/me", {
        //   headers: { Authorization: `Bearer ${storedToken}` },
        // });
        // if (!res.ok) throw new Error("Session expired");
        // const { user: freshUser } = await res.json();
        // setUser(freshUser);
        // storage.set(STORAGE_KEY, JSON.stringify(freshUser));

        // Mock: simulate network latency so the splash is visible during dev
        await new Promise((r) => setTimeout(r, 600));
        const parsed: User = JSON.parse(storedUser);
        setUser(parsed);
        setSessionStatus("restored");
      } catch {
        // Expired or invalid token — clear everything silently
        clearStoredSession();
        setUser(null);
        setSessionStatus("unauthenticated");
      }
    };

    restoreSession();
  }, []); // intentionally empty — run once on mount only

  // ── Methods ──────────────────────────────────────────────────────────────────

  const signin = useCallback(
    async (credentials: SigninCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: replace with real API call
        // const res = await fetch("/api/auth/signin", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(credentials),
        // });
        // if (!res.ok) throw new Error((await res.json()).message);
        // const { user: authedUser, token } = await res.json();

        const authedUser: User = {
          id: "1",
          name: "John Admin",
          email: credentials.email,
          role: "ADMIN",
          isVerified: true,
        };
        const token = "mock_token_abc123";

        setUser(authedUser);
        setSessionStatus("restored");
        storage.set(STORAGE_KEY, JSON.stringify(authedUser));
        storage.set(TOKEN_KEY, token);
        router.push(ROLE_REDIRECTS[authedUser.role]);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Invalid email or password.";
        setError({ message, field: "general" });
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const signup = useCallback(
    async (data: SignupData) => {
      setIsLoading(true);
      setError(null);
      try {
        if (data.password !== data.confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        // TODO: replace with real API call
        // const res = await fetch("/api/auth/signup", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(data),
        // });
        // if (!res.ok) throw new Error((await res.json()).message);

        router.push("/auth/verify");
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again.";
        setError({ message, field: "general" });
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    setSessionStatus("unauthenticated");
    clearStoredSession();
    router.push("/auth");
  }, [router]);

  const forgotPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      // TODO: replace with real API call
      // await fetch("/api/auth/forgot-password", {
      //   method: "POST",
      //   body: JSON.stringify({ email }),
      // });
      console.log("Password reset sent to:", email);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset email.";
      setError({ message, field: "general" });
      throw err; // re-throw so the form can react
    }
  }, []);

  const verify = useCallback(
    async (token: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: replace with real API call
        // const res = await fetch(`/api/auth/verify?token=${token}`);
        // if (!res.ok) throw new Error("Invalid or expired verification link.");
        console.log("Verifying token:", token);
        router.push("/auth");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Verification failed.";
        setError({ message, field: "general" });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: replace with real API call
        // const res = await fetch("/api/auth/reset-password", {
        //   method: "POST",
        //   body: JSON.stringify({ token, password: newPassword }),
        // });
        // if (!res.ok) throw new Error("Reset link is invalid or has expired.");
        console.log("Resetting password with token:", token, newPassword);
        router.push("/auth");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Password reset failed.";
        setError({ message, field: "general" });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sessionStatus,
        error,
        signin,
        signup,
        logout,
        forgotPassword,
        verify,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── 5. Hook ─────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
};
