"use client";

// context/ApplicationContext.tsx
// Manages committee and skills change requests submitted by the logged-in user.
//
// Reads from UserContext to prefill current committee/skills on forms.
// Resets all state on logout (called by AuthContext).
//
// Consumed by:
//   - Profile page  → submit committee or skills application
//   - Dashboard     → show pending application status + count

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicationType = "committee" | "skills";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Application {
  id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  requestedCommittee?: string;
  requestedSkills?: string[];
  reason?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface SubmitApplicationPayload {
  type: ApplicationType;
  requestedCommittee?: string;
  requestedSkills?: string[];
  reason?: string;
}

interface ApplicationState {
  applications: Application[];
  pendingCount: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  // Whether applications have been loaded at least once
  initialized: boolean;
}

interface ApplicationContextValue extends ApplicationState {
  // Load the current user's own applications
  loadMyApplications: (opts?: {
    type?: string;
    status?: string;
  }) => Promise<void>;
  // Submit a new application
  submitApplication: (
    payload: SubmitApplicationPayload,
    token: string,
  ) => Promise<Application>;
  // Derived helpers
  hasPending: (type: ApplicationType) => boolean;
  getLatest: (type: ApplicationType) => Application | undefined;
  // Reset on logout
  reset: () => void;
  clearError: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ApplicationContext = createContext<ApplicationContextValue | null>(null);

export function useApplications(): ApplicationContextValue {
  const ctx = useContext(ApplicationContext);
  if (!ctx)
    throw new Error("useApplications must be used within ApplicationProvider");
  return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

const INITIAL_STATE: ApplicationState = {
  applications: [],
  pendingCount: 0,
  loading: false,
  submitting: false,
  error: null,
  initialized: false,
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function ApplicationProvider({
  children,
  token,
}: {
  children: ReactNode;
  token: string | null; // pass from AuthContext
}) {
  const [state, setState] = useState<ApplicationState>(INITIAL_STATE);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // ── loadMyApplications ─────────────────────────────────────────────────────
  // Fetches all applications for the current user.
  // The /api/admin/applications route is for admins — users see their own
  // applications via the profile page. We filter by userId on the client
  // since we store them in state after POST anyway.
  // For the full list we call GET /api/admin/applications with the user token
  // which returns 403 — so instead we track locally via state after each submit
  // and supplement with a dedicated user-facing fetch.
  //
  // NOTE: If you add GET /api/applications (user's own list) later, swap the
  // fetch URL below. For now we maintain state purely from submit responses
  // and a lightweight re-fetch pattern.
  const loadMyApplications = useCallback(
    async (opts: { type?: string; status?: string } = {}) => {
      if (!token) return;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (opts.type) params.set("type", opts.type);
        if (opts.status) params.set("status", opts.status);
        const res = await fetch(`/api/applications?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await handleResponse<{
          applications: Application[];
          total: number;
        }>(res);
        const pending = data.applications.filter(
          (a) => a.status === "pending",
        ).length;
        setState((s) => ({
          ...s,
          applications: data.applications,
          pendingCount: pending,
          loading: false,
          initialized: true,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loading: false,
          initialized: true,
          error:
            err instanceof Error ? err.message : "Failed to load applications",
        }));
      }
    },
    [token],
  );

  // ── submitApplication ──────────────────────────────────────────────────────
  const submitApplication = useCallback(
    async (
      payload: SubmitApplicationPayload,
      tkn: string,
    ): Promise<Application> => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: authHeaders(tkn),
          body: JSON.stringify(payload),
        });
        const data = await handleResponse<{
          applicationId: string;
          type: ApplicationType;
          status: ApplicationStatus;
          message: string;
        }>(res);

        // Build a local Application object from the response
        const newApp: Application = {
          id: data.applicationId,
          type: data.type,
          status: data.status,
          requestedCommittee: payload.requestedCommittee,
          requestedSkills: payload.requestedSkills,
          reason: payload.reason ?? null,
          reviewNote: null,
          reviewedAt: null,
          createdAt: new Date().toISOString(),
        };

        setState((s) => ({
          ...s,
          applications: [newApp, ...s.applications],
          pendingCount: s.pendingCount + 1,
          submitting: false,
        }));

        return newApp;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to submit application";
        setState((s) => ({ ...s, submitting: false, error: message }));
        throw err;
      }
    },
    [],
  );

  // ── Derived helpers ────────────────────────────────────────────────────────

  // Returns true if user has a pending application of this type
  const hasPending = useCallback(
    (type: ApplicationType): boolean => {
      return state.applications.some(
        (a) => a.type === type && a.status === "pending",
      );
    },
    [state.applications],
  );

  // Returns the most recent application of a given type
  const getLatest = useCallback(
    (type: ApplicationType): Application | undefined => {
      return state.applications.find((a) => a.type === type);
    },
    [state.applications],
  );

  return (
    <ApplicationContext.Provider
      value={{
        ...state,
        loadMyApplications,
        submitApplication,
        hasPending,
        getLatest,
        reset,
        clearError,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}
