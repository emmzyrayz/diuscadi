"use client";

// context/AdminContext.tsx
// Manages all admin/webmaster dashboard data in one context.
// Role-gated at the API level — this context just calls the routes.
//
// Borrows EventContext.refreshFeed() after event mutations so the
// user-facing feed stays in sync.
//
// Consumed by:
//   - Admin dashboard  → analytics, users, applications, invites
//   - Event management → create, update, cancel/delete events
//   - Webmaster tools  → role changes, account suspensions, invite generation

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  vaultId: string;
  fullName: string;
  email: string;
  phone?: unknown;
  avatar: string | null;
  role: string;
  eduStatus: string;
  committee: string | null;
  skills: string[];
  profileCompleted: boolean;
  membershipStatus: string;
  isAccountActive: boolean;
  isEmailVerified: boolean;
  analytics: {
    eventsRegistered: number;
    eventsAttended: number;
    lastEventRegisteredAt: string | null;
  };
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  format: string;
  eventDate: string;
  endDate: string | null;
  registrationDeadline: string;
  capacity: number;
  registered: number;
  targetEduStatus: string;
  requiredSkills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  title: string;
  slug: string;
  overview?: string;
  description?: string;
  shortDescription?: string;
  category: string;
  format: string;
  location?: Record<string, string>;
  locationScope?: string;
  image?: string;
  eventDate: string;
  endDate?: string;
  registrationDeadline: string;
  capacity?: number;
  targetEduStatus?: string;
  requiredSkills?: string[];
  learningOutcomes?: string[];
  tags?: string[];
  level?: string;
  instructor?: string;
  duration?: string;
  status?: string;
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

export interface Analytics {
  users: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    byRole: Record<string, number>;
    byEduStatus: Record<string, number>;
  };
  events: {
    total: number;
    upcoming: number;
    byStatus: Record<string, number>;
  };
  registrations: {
    total: number;
    thisMonth: number;
    checkedIn: number;
    attendanceRate: number;
  };
  topEvents: Array<{
    eventId: string;
    title: string;
    slug: string;
    eventDate: string;
    registrations: number;
  }>;
  recentSignups: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    eduStatus: string;
    createdAt: string;
  }>;
  health: {
    browserBreakdown: Array<{
      browser: string;
      visits: number;
      avgLcpMs: number | null;
    }>;
  };
  generatedAt: string;
}

export interface AdminApplication {
  id: string;
  type: string;
  status: string;
  requestedCommittee: string | null;
  requestedSkills: string[] | null;
  reason: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatar: string | null;
  } | null;
}

export interface Invite {
  id: string;
  code: string;
  status: string;
  maxUses: number;
  useCount: number;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── State ─────────────────────────────────────────────────────────────────────

interface AdminState {
  // Users
  users: AdminUser[];
  usersPagination: Pagination | null;
  loadingUsers: boolean;

  // Events (admin view — all statuses)
  adminEvents: AdminEvent[];
  adminEventsPagination: Pagination | null;
  loadingAdminEvents: boolean;

  // Analytics
  analytics: Analytics | null;
  loadingAnalytics: boolean;

  // Applications
  applications: AdminApplication[];
  applicationsPagination: Pagination | null;
  loadingApplications: boolean;

  // Invites
  invites: Invite[];
  invitesPagination: Pagination | null;
  loadingInvites: boolean;

  // Shared
  error: string | null;
  submitting: boolean;
}

interface AdminContextValue extends AdminState {
  // ── Users ──────────────────────────────────────────────────────────────────
  loadUsers: (
    opts?: { role?: string; status?: string; search?: string; page?: number },
    token?: string,
  ) => Promise<void>;
  changeRole: (userId: string, role: string, token: string) => Promise<void>;
  changeStatus: (
    userId: string,
    isActive: boolean,
    reason?: string,
    token?: string,
  ) => Promise<void>;

  // ── Events ─────────────────────────────────────────────────────────────────
  loadAdminEvents: (
    opts?: {
      status?: string;
      category?: string;
      search?: string;
      page?: number;
    },
    token?: string,
  ) => Promise<void>;
  createEvent: (
    payload: CreateEventPayload,
    token: string,
    refreshFeed?: () => void,
  ) => Promise<AdminEvent>;
  updateEvent: (
    id: string,
    payload: UpdateEventPayload,
    token: string,
    refreshFeed?: () => void,
  ) => Promise<void>;
  deleteEvent: (
    id: string,
    action: "cancel" | "delete",
    token: string,
    refreshFeed?: () => void,
  ) => Promise<void>;

  // ── Analytics ──────────────────────────────────────────────────────────────
  loadAnalytics: (token: string) => Promise<void>;

  // ── Applications ───────────────────────────────────────────────────────────
  loadApplications: (
    opts?: { status?: string; type?: string; page?: number },
    token?: string,
  ) => Promise<void>;
  reviewApplication: (
    id: string,
    action: "approve" | "reject",
    reviewNote?: string,
    token?: string,
  ) => Promise<void>;

  // ── Invites ────────────────────────────────────────────────────────────────
  loadInvites: (
    opts?: { status?: string; page?: number },
    token?: string,
  ) => Promise<void>;
  generateInvites: (
    opts: {
      count?: number;
      maxUses?: number;
      expiresAt?: string;
      note?: string;
    },
    token: string,
  ) => Promise<Invite[]>;

  // ── Shared ─────────────────────────────────────────────────────────────────
  reset: () => void;
  clearError: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
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

const INITIAL_STATE: AdminState = {
  users: [],
  usersPagination: null,
  loadingUsers: false,
  adminEvents: [],
  adminEventsPagination: null,
  loadingAdminEvents: false,
  analytics: null,
  loadingAnalytics: false,
  applications: [],
  applicationsPagination: null,
  loadingApplications: false,
  invites: [],
  invitesPagination: null,
  loadingInvites: false,
  error: null,
  submitting: false,
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function AdminProvider({
  children,
  token,
}: {
  children: ReactNode;
  token: string | null;
}) {
  const [state, setState] = useState<AdminState>(INITIAL_STATE);

  const clearError = useCallback(
    () => setState((s) => ({ ...s, error: null })),
    [],
  );
  const reset = useCallback(() => setState(INITIAL_STATE), []);

  // ── loadUsers ──────────────────────────────────────────────────────────────
  const loadUsers = useCallback(
    async (
      opts: {
        role?: string;
        status?: string;
        search?: string;
        page?: number;
      } = {},
      tkn = token ?? "",
    ) => {
      if (!tkn) return;
      setState((s) => ({ ...s, loadingUsers: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (opts.role) params.set("role", opts.role);
        if (opts.status) params.set("status", opts.status);
        if (opts.search) params.set("search", opts.search);
        if (opts.page) params.set("page", String(opts.page));

        const res = await fetch(`/api/admin/users?${params}`, {
          headers: { Authorization: `Bearer ${tkn}` },
        });
        const data = await handleResponse<{
          users: AdminUser[];
          pagination: Pagination;
        }>(res);
        setState((s) => ({
          ...s,
          users: data.users,
          usersPagination: data.pagination,
          loadingUsers: false,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loadingUsers: false,
          error: err instanceof Error ? err.message : "Failed to load users",
        }));
      }
    },
    [token],
  );

  // ── changeRole ─────────────────────────────────────────────────────────────
  const changeRole = useCallback(
    async (userId: string, role: string, tkn: string) => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        const res = await fetch(`/api/admin/users/${userId}/role`, {
          method: "PATCH",
          headers: authHeaders(tkn),
          body: JSON.stringify({ role }),
        });
        await handleResponse(res);
        // Optimistic update
        setState((s) => ({
          ...s,
          submitting: false,
          users: s.users.map((u) => (u.id === userId ? { ...u, role } : u)),
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          submitting: false,
          error: err instanceof Error ? err.message : "Failed to change role",
        }));
        throw err;
      }
    },
    [],
  );

  // ── changeStatus ───────────────────────────────────────────────────────────
  const changeStatus = useCallback(
    async (
      userId: string,
      isActive: boolean,
      reason?: string,
      tkn = token ?? "",
    ) => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        const res = await fetch(`/api/admin/users/${userId}/status`, {
          method: "PATCH",
          headers: authHeaders(tkn),
          body: JSON.stringify({ isActive, ...(reason ? { reason } : {}) }),
        });
        await handleResponse(res);
        setState((s) => ({
          ...s,
          submitting: false,
          users: s.users.map((u) =>
            u.id === userId ? { ...u, isAccountActive: isActive } : u,
          ),
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          submitting: false,
          error:
            err instanceof Error
              ? err.message
              : "Failed to change account status",
        }));
        throw err;
      }
    },
    [token],
  );

  // ── loadAdminEvents ────────────────────────────────────────────────────────
  const loadAdminEvents = useCallback(
    async (
      opts: {
        status?: string;
        category?: string;
        search?: string;
        page?: number;
      } = {},
      tkn = token ?? "",
    ) => {
      if (!tkn) return;
      setState((s) => ({ ...s, loadingAdminEvents: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (opts.status) params.set("status", opts.status);
        if (opts.category) params.set("category", opts.category);
        if (opts.search) params.set("search", opts.search);
        if (opts.page) params.set("page", String(opts.page));

        const res = await fetch(`/api/admin/events?${params}`, {
          headers: { Authorization: `Bearer ${tkn}` },
        });
        const data = await handleResponse<{
          events: AdminEvent[];
          pagination: Pagination;
        }>(res);
        setState((s) => ({
          ...s,
          adminEvents: data.events,
          adminEventsPagination: data.pagination,
          loadingAdminEvents: false,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loadingAdminEvents: false,
          error: err instanceof Error ? err.message : "Failed to load events",
        }));
      }
    },
    [token],
  );

  // ── createEvent ────────────────────────────────────────────────────────────
  const createEvent = useCallback(
    async (
      payload: CreateEventPayload,
      tkn: string,
      refreshFeed?: () => void,
    ): Promise<AdminEvent> => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: authHeaders(tkn),
          body: JSON.stringify(payload),
        });
        const data = await handleResponse<{
          eventId: string;
          slug: string;
          status: string;
        }>(res);

        // Build a lightweight AdminEvent from the response + payload
        const newEvent: AdminEvent = {
          id: data.eventId,
          title: payload.title,
          slug: data.slug,
          status: data.status,
          category: payload.category,
          format: payload.format,
          eventDate: payload.eventDate,
          endDate: payload.endDate ?? null,
          registrationDeadline: payload.registrationDeadline,
          capacity: payload.capacity ?? 0,
          registered: 0,
          targetEduStatus: payload.targetEduStatus ?? "ALL",
          requiredSkills: payload.requiredSkills ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setState((s) => ({
          ...s,
          adminEvents: [newEvent, ...s.adminEvents],
          submitting: false,
        }));

        // Sync user-facing EventContext feed
        refreshFeed?.();
        return newEvent;
      } catch (err) {
        setState((s) => ({
          ...s,
          submitting: false,
          error: err instanceof Error ? err.message : "Failed to create event",
        }));
        throw err;
      }
    },
    [],
  );

  // ── updateEvent ────────────────────────────────────────────────────────────
  const updateEvent = useCallback(
    async (
      id: string,
      payload: UpdateEventPayload,
      tkn: string,
      refreshFeed?: () => void,
    ) => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        const res = await fetch(`/api/admin/events/${id}`, {
          method: "PATCH",
          headers: authHeaders(tkn),
          body: JSON.stringify(payload),
        });
        await handleResponse(res);
        setState((s) => ({
          ...s,
          submitting: false,
          adminEvents: s.adminEvents.map((e) =>
            e.id === id
              ? { ...e, ...payload, updatedAt: new Date().toISOString() }
              : e,
          ),
        }));
        refreshFeed?.();
      } catch (err) {
        setState((s) => ({
          ...s,
          submitting: false,
          error: err instanceof Error ? err.message : "Failed to update event",
        }));
        throw err;
      }
    },
    [],
  );

  // ── deleteEvent ────────────────────────────────────────────────────────────
  const deleteEvent = useCallback(
    async (
      id: string,
      action: "cancel" | "delete",
      tkn: string,
      refreshFeed?: () => void,
    ) => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        const res = await fetch(`/api/admin/events/${id}`, {
          method: "DELETE",
          headers: authHeaders(tkn),
          body: JSON.stringify({ action }),
        });
        await handleResponse(res);
        setState((s) => ({
          ...s,
          submitting: false,
          adminEvents:
            action === "delete"
              ? // Hard delete — remove from list
                s.adminEvents.filter((e) => e.id !== id)
              : // Cancel — update status in list
                s.adminEvents.map((e) =>
                  e.id === id ? { ...e, status: "cancelled" } : e,
                ),
        }));
        refreshFeed?.();
      } catch (err) {
        setState((s) => ({
          ...s,
          submitting: false,
          error: err instanceof Error ? err.message : "Failed to delete event",
        }));
        throw err;
      }
    },
    [],
  );

  // ── loadAnalytics ──────────────────────────────────────────────────────────
  const loadAnalytics = useCallback(async (tkn: string) => {
    setState((s) => ({ ...s, loadingAnalytics: true, error: null }));
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      const data = await handleResponse<Analytics>(res);
      setState((s) => ({ ...s, analytics: data, loadingAnalytics: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loadingAnalytics: false,
        error: err instanceof Error ? err.message : "Failed to load analytics",
      }));
    }
  }, []);

  // ── loadApplications ───────────────────────────────────────────────────────
  const loadApplications = useCallback(
    async (
      opts: { status?: string; type?: string; page?: number } = {},
      tkn = token ?? "",
    ) => {
      if (!tkn) return;
      setState((s) => ({ ...s, loadingApplications: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (opts.status) params.set("status", opts.status);
        if (opts.type) params.set("type", opts.type);
        if (opts.page) params.set("page", String(opts.page));

        const res = await fetch(`/api/admin/applications?${params}`, {
          headers: { Authorization: `Bearer ${tkn}` },
        });
        const data = await handleResponse<{
          applications: AdminApplication[];
          pagination: Pagination;
        }>(res);
        setState((s) => ({
          ...s,
          applications: data.applications,
          applicationsPagination: data.pagination,
          loadingApplications: false,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loadingApplications: false,
          error:
            err instanceof Error ? err.message : "Failed to load applications",
        }));
      }
    },
    [token],
  );

  // ── reviewApplication ──────────────────────────────────────────────────────
  const reviewApplication = useCallback(
    async (
      id: string,
      action: "approve" | "reject",
      reviewNote?: string,
      tkn = token ?? "",
    ) => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        const res = await fetch(`/api/admin/applications/${id}`, {
          method: "PATCH",
          headers: authHeaders(tkn),
          body: JSON.stringify({
            action,
            ...(reviewNote ? { reviewNote } : {}),
          }),
        });
        await handleResponse(res);
        setState((s) => ({
          ...s,
          submitting: false,
          applications: s.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: action === "approve" ? "approved" : "rejected",
                  reviewNote: reviewNote ?? null,
                }
              : a,
          ),
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          submitting: false,
          error:
            err instanceof Error ? err.message : "Failed to review application",
        }));
        throw err;
      }
    },
    [token],
  );

  // ── loadInvites ────────────────────────────────────────────────────────────
  const loadInvites = useCallback(
    async (
      opts: { status?: string; page?: number } = {},
      tkn = token ?? "",
    ) => {
      if (!tkn) return;
      setState((s) => ({ ...s, loadingInvites: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (opts.status) params.set("status", opts.status);
        if (opts.page) params.set("page", String(opts.page));

        const res = await fetch(`/api/admin/invites?${params}`, {
          headers: { Authorization: `Bearer ${tkn}` },
        });
        const data = await handleResponse<{
          invites: Invite[];
          pagination: Pagination;
        }>(res);
        setState((s) => ({
          ...s,
          invites: data.invites,
          invitesPagination: data.pagination,
          loadingInvites: false,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loadingInvites: false,
          error: err instanceof Error ? err.message : "Failed to load invites",
        }));
      }
    },
    [token],
  );

  // ── generateInvites ────────────────────────────────────────────────────────
  const generateInvites = useCallback(
    async (
      opts: {
        count?: number;
        maxUses?: number;
        expiresAt?: string;
        note?: string;
      },
      tkn: string,
    ): Promise<Invite[]> => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        const res = await fetch("/api/admin/invites", {
          method: "POST",
          headers: authHeaders(tkn),
          body: JSON.stringify(opts),
        });
        const data = await handleResponse<{
          invites: Array<{ id: string; code: string; maxUses: number }>;
        }>(res);

        // Build full Invite objects from the slim response
        const newInvites: Invite[] = data.invites.map((inv) => ({
          id: inv.id,
          code: inv.code,
          status: "active",
          maxUses: inv.maxUses,
          useCount: 0,
          note: opts.note ?? null,
          expiresAt: opts.expiresAt ?? null,
          createdAt: new Date().toISOString(),
        }));

        setState((s) => ({
          ...s,
          invites: [...newInvites, ...s.invites],
          submitting: false,
        }));

        return newInvites;
      } catch (err) {
        setState((s) => ({
          ...s,
          submitting: false,
          error:
            err instanceof Error ? err.message : "Failed to generate invites",
        }));
        throw err;
      }
    },
    [],
  );

  return (
    <AdminContext.Provider
      value={{
        ...state,
        loadUsers,
        changeRole,
        changeStatus,
        loadAdminEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        loadAnalytics,
        loadApplications,
        reviewApplication,
        loadInvites,
        generateInvites,
        reset,
        clearError,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
