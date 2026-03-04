"use client";
// context/EventContext.tsx
//
// Lazy-loading context — only fetches when the user visits /events or /my-tickets.
// Call `loadFeed()` or `loadRegistrations()` explicitly from those pages.
// Automatically resets on logout.

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventTicketType {
  _id: string;
  name: string;
  price: number;
  currency: string;
}

export interface EventLocation {
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
}

export interface FeedEvent {
  _id: string;
  slug: string;
  title: string;
  overview: string;
  image: string;
  format: "physical" | "virtual" | "hybrid";
  location?: EventLocation;
  eventDate: string;
  endDate?: string;
  registrationDeadline: string;
  duration?: string;
  level?: string;
  category: string;
  tags: string[];
  capacity: number;
  slotsRemaining: number;
  registeredCount: number;
  isRegistered: boolean;
  ticketType?: EventTicketType;
  status: string;
}

export interface MyRegistration {
  _id: string;
  status: "registered" | "checked-in" | "cancelled";
  inviteCode: string;
  registeredAt: string;
  checkedInAt?: string;
  referralCodeUsed?: string;
  event: {
    _id: string;
    slug: string;
    title: string;
    overview: string;
    image: string;
    format: string;
    location?: EventLocation;
    eventDate: string;
    endDate?: string;
    status: string;
    category: string;
  };
  ticketType?: EventTicketType;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface RegisterResult {
  success: boolean;
  registrationId?: string;
  inviteCode?: string;
  error?: string;
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface EventContextType {
  // Feed
  feed: FeedEvent[];
  feedPagination: Pagination | null;
  feedLoading: boolean;
  feedError: string | null;
  loadFeed: (page?: number) => Promise<void>;
  refreshFeed: () => Promise<void>;

  // My registrations
  myRegistrations: MyRegistration[];
  registrationsLoading: boolean;
  registrationsError: string | null;
  loadRegistrations: (status?: string) => Promise<void>;
  refreshRegistrations: () => Promise<void>;

  // Actions
  registerForEvent: (
    eventId: string,
    ticketTypeId: string,
    referralCode?: string,
  ) => Promise<RegisterResult>;

  clearErrors: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const EventContext = createContext<EventContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem("diuscadi_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, sessionStatus } = useAuth();

  // ── Feed state ────────────────────────────────────────────────────────────
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [feedPagination, setFeedPagination] = useState<Pagination | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // ── Registrations state ───────────────────────────────────────────────────
  const [myRegistrations, setMyRegistrations] = useState<MyRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationsError, setRegistrationsError] = useState<string | null>(
    null,
  );

  // ── Reset on logout ───────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStatus === "pending") return;
    if (!isAuthenticated) {
      setFeed([]);
      setFeedPagination(null);
      setMyRegistrations([]);
      setFeedError(null);
      setRegistrationsError(null);
    }
  }, [isAuthenticated, sessionStatus]);

  // ── loadFeed ──────────────────────────────────────────────────────────────
  const loadFeed = useCallback(
    async (page = 1) => {
      if (!isAuthenticated) return;
      setFeedLoading(true);
      setFeedError(null);
      try {
        const res = await fetch(`/api/events/feed?page=${page}&limit=20`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load events.");

        // Append on pagination, replace on first page
        setFeed((prev) =>
          page === 1 ? data.events : [...prev, ...data.events],
        );
        setFeedPagination(data.pagination);
      } catch (err) {
        setFeedError(
          err instanceof Error ? err.message : "Failed to load events.",
        );
      } finally {
        setFeedLoading(false);
      }
    },
    [isAuthenticated],
  );

  const refreshFeed = useCallback(() => loadFeed(1), [loadFeed]);

  // ── loadRegistrations ─────────────────────────────────────────────────────
  const loadRegistrations = useCallback(
    async (status?: string) => {
      if (!isAuthenticated) return;
      setRegistrationsLoading(true);
      setRegistrationsError(null);
      try {
        const url = status
          ? `/api/events/my-registrations?status=${status}`
          : `/api/events/my-registrations`;
        const res = await fetch(url, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error ?? "Failed to load registrations.");
        setMyRegistrations(data.registrations);
      } catch (err) {
        setRegistrationsError(
          err instanceof Error ? err.message : "Failed to load registrations.",
        );
      } finally {
        setRegistrationsLoading(false);
      }
    },
    [isAuthenticated],
  );

  const refreshRegistrations = useCallback(
    () => loadRegistrations(),
    [loadRegistrations],
  );

  // ── registerForEvent ──────────────────────────────────────────────────────
  const registerForEvent = useCallback(
    async (
      eventId: string,
      ticketTypeId: string,
      referralCode?: string,
    ): Promise<RegisterResult> => {
      if (!isAuthenticated)
        return { success: false, error: "Not authenticated." };

      try {
        const res = await fetch("/api/events/register", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            eventId,
            ticketTypeId,
            referralCodeUsed: referralCode,
          }),
        });
        const data = await res.json();
        if (!res.ok)
          return {
            success: false,
            error: data.error ?? "Registration failed.",
          };

        // Optimistically update isRegistered on the feed item
        setFeed((prev) =>
          prev.map((e) =>
            e._id === eventId
              ? {
                  ...e,
                  isRegistered: true,
                  slotsRemaining: e.slotsRemaining - 1,
                  registeredCount: e.registeredCount + 1,
                }
              : e,
          ),
        );

        return {
          success: true,
          registrationId: data.registrationId,
          inviteCode: data.inviteCode,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Registration failed.",
        };
      }
    },
    [isAuthenticated],
  );

  const clearErrors = useCallback(() => {
    setFeedError(null);
    setRegistrationsError(null);
  }, []);

  return (
    <EventContext.Provider
      value={{
        feed,
        feedPagination,
        feedLoading,
        feedError,
        loadFeed,
        refreshFeed,
        myRegistrations,
        registrationsLoading,
        registrationsError,
        loadRegistrations,
        refreshRegistrations,
        registerForEvent,
        clearErrors,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useEvents = (): EventContextType => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within an EventProvider.");
  return ctx;
};
