"use client";
// context/EventContext.tsx
//
// Owns event feed and single event detail for the authenticated user.
// Lazy — nothing is fetched on mount. Pages call loadFeed() / loadEvent()
// explicitly when they mount.

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";

const IS_DEV = process.env.NODE_ENV === "development";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketTypeSummary {
  id: string;
  name: string;
  price: number;
  currency: string;
  maxQuantity: number;
  availableFrom: string | null;
  availableUntil: string | null;
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  overview: string;
  category: string;
  tags: string[];
  level: string | null;
  format: string;
  location: Record<string, string> | null;
  eventDate: string;
  endDate: string | null;
  registrationDeadline: string;
  duration: string | null;
  capacity: number;
  registeredCount: number;
  slotsRemaining: number;
  /**
   * Resolved image URL — always a plain string for the client.
   * The API route resolves CloudinaryImage fields (banner → logo → fallback)
   * before returning this value so the context never handles CloudinaryImage objects.
   */
  image: string;
  instructor: string | null;
  targetEduStatus: string;
  requiredSkills: string[];
  locationScope: string;
  ticketTypes: TicketTypeSummary[];
  // Only present on feed events (requires auth)
  isRegistered?: boolean;
  myRegistrationId?: string | null;
}

export interface EventDetail extends EventSummary {
  learningOutcomes: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  inviteCode?: string;
  registrationId?: string;
}

export interface CancelResult {
  success: boolean;
  error?: string;
}

interface EventContextType {
  // Feed
  feed: EventSummary[];
  feedPagination: Pagination | null;
  feedLoading: boolean;
  feedError: string | null;
  loadFeed: (page?: number) => Promise<void>;
  refreshFeed: () => Promise<void>;

  // Public events
  publicEvents: EventSummary[];
  publicEventsLoading: boolean;
  publicEventsError: string | null;
  loadPublicEvents: (limit?: number, category?: string) => Promise<void>;

  // Single event
  currentEvent: EventDetail | null;
  currentEventLoading: boolean;
  currentEventError: string | null;
  loadEvent: (slug: string) => Promise<void>;
  clearCurrentEvent: () => void;

  // Registration
  registerForEvent: (
    eventId: string,
    ticketTypeId: string,
    referralCode?: string,
  ) => Promise<RegisterResult>;
  cancelRegistration: (registrationId: string) => Promise<CancelResult>;

  clearErrors: () => void;
}


// const DUMMY_EVENTS: EventSummary[] = [
//   {
//     id: "dummy-1",
//     slug: "career-navigation-2026",
//     title: "[DEMO] Career Navigation Summit",
//     overview: "Practical roadmap for graduates.",
//     category: "Career",
//     tags: ["Future", "Jobs"],
//     level: "Beginner",
//     format: "In-Person",
//     location: { venue: "Main Auditorium" },
//     eventDate: new Date().toISOString(),
//     endDate: null,
//     registrationDeadline: new Date().toISOString(),
//     capacity: 100,
//     registeredCount: 50,
//     slotsRemaining: 50,
//     image: "/assets/img/downloads/networking-diuscadi.webp", // Ensure path is correct
//     instructor: "Dr. Umeh",
//     targetEduStatus: "Final Year",
//     requiredSkills: ["None"],
//     locationScope: "Internal",
//     ticketTypes: [],
//     duration: null
//   },
// ];

// ─── Context ──────────────────────────────────────────────────────────────────

const EventContext = createContext<EventContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();

  const [feed, setFeed] = useState<EventSummary[]>([]);
  const [feedPagination, setFeedPagination] = useState<Pagination | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [currentFeedPage, setCurrentFeedPage] = useState(1);

  const [publicEvents, setPublicEvents] = useState<EventSummary[]>([]);
  const [publicEventsLoading, setPublicEventsLoading] = useState(false);
  const [publicEventsError, setPublicEventsError] = useState<string | null>(
    null,
  );

  const [currentEvent, setCurrentEvent] = useState<EventDetail | null>(null);
  const [currentEventLoading, setCurrentEventLoading] = useState(false);
  const [currentEventError, setCurrentEventError] = useState<string | null>(
    null,
  );

  // ── Load feed ──────────────────────────────────────────────────────────────
  const loadFeed = useCallback(
    async (page = 1) => {
      if (!isAuthenticated) return;
      setFeedLoading(true);
      setFeedError(null);
      try {
        const res = await fetch(`/api/events/feed?page=${page}&limit=10`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load events");
        setFeed(data.events);
        setFeedPagination(data.pagination);
        setCurrentFeedPage(page);
      } catch (err) {
        setFeedError(
          err instanceof Error ? err.message : "Failed to load events",
        );
      } finally {
        setFeedLoading(false);
      }
    },
    [isAuthenticated],
  );

  const refreshFeed = useCallback(
    () => loadFeed(currentFeedPage),
    [loadFeed, currentFeedPage],
  );

  // ── Load public events ─────────────────────────────────────────────────────
  const loadPublicEvents = useCallback(async (limit = 6, category?: string) => {
    setPublicEventsLoading(true);
    setPublicEventsError(null);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (category) params.set("category", category);
      const res = await fetch(`/api/events/public?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to load events");

      // LOGIC: Fallback handling
        setPublicEvents(data.events);
    } catch (err) {
      setPublicEventsError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setPublicEventsLoading(false);
    }
  }, []);

  // ── Load single event ──────────────────────────────────────────────────────
  const loadEvent = useCallback(async (slug: string) => {
    setCurrentEventLoading(true);
    setCurrentEventError(null);
    try {
      const res = await fetch(`/api/events/${slug}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Event not found");
      setCurrentEvent(data.event);
    } catch (err) {
      setCurrentEventError(
        err instanceof Error ? err.message : "Failed to load event",
      );
    } finally {
      setCurrentEventLoading(false);
    }
  }, []);

  const clearCurrentEvent = useCallback(() => setCurrentEvent(null), []);

  // ── Register ───────────────────────────────────────────────────────────────
  const registerForEvent = useCallback(
    async (
      eventId: string,
      ticketTypeId: string,
      referralCode?: string,
    ): Promise<RegisterResult> => {
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
          return { success: false, error: data.error ?? "Registration failed" };

        // Optimistic update
        setFeed((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  isRegistered: true,
                  myRegistrationId: data.registration.id,
                  slotsRemaining: Math.max(0, e.slotsRemaining - 1),
                }
              : e,
          ),
        );
        setCurrentEvent((prev) =>
          prev?.id === eventId
            ? {
                ...prev,
                isRegistered: true,
                myRegistrationId: data.registration.id,
                slotsRemaining: Math.max(0, prev.slotsRemaining - 1),
              }
            : prev,
        );

        return {
          success: true,
          inviteCode: data.registration.inviteCode,
          registrationId: data.registration.id,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Registration failed",
        };
      }
    },
    [],
  );

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const cancelRegistration = useCallback(
    async (registrationId: string): Promise<CancelResult> => {
      try {
        const res = await fetch(`/api/events/register/${registrationId}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok)
          return { success: false, error: data.error ?? "Cancellation failed" };

        setFeed((prev) =>
          prev.map((e) =>
            e.myRegistrationId === registrationId
              ? {
                  ...e,
                  isRegistered: false,
                  myRegistrationId: null,
                  slotsRemaining: e.slotsRemaining + 1,
                }
              : e,
          ),
        );
        setCurrentEvent((prev) =>
          prev?.myRegistrationId === registrationId
            ? {
                ...prev,
                isRegistered: false,
                myRegistrationId: null,
                slotsRemaining: prev.slotsRemaining + 1,
              }
            : prev,
        );

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Cancellation failed",
        };
      }
    },
    [],
  );

  const clearErrors = useCallback(() => {
    setFeedError(null);
    setPublicEventsError(null);
    setCurrentEventError(null);
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
        publicEvents,
        publicEventsLoading,
        publicEventsError,
        loadPublicEvents,
        currentEvent,
        currentEventLoading,
        currentEventError,
        loadEvent,
        clearCurrentEvent,
        registerForEvent,
        cancelRegistration,
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
  if (!ctx) throw new Error("useEvents must be used within an EventProvider");
  return ctx;
};
