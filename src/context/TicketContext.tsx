"use client";
// context/TicketContext.tsx
//
// Owns the user's tickets (event registrations) and check-in state.
// Lazy — nothing fetched on mount. Pages call loadTickets() / loadTicket()
// explicitly when they mount.
//
// TicketContext handles:
//   - All user tickets   (GET /api/tickets)
//   - Single ticket + QR (GET /api/tickets/[id])
//   - Check-in           (POST /api/events/check-in) — for admin/moderator UI

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import type { RegistrationStatus } from "@/lib/models/EventRegistration";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketEventSummary {
  id: string;
  slug: string;
  title: string;
  format: string;
  location: Record<string, string> | null;
  eventDate: string;
  endDate: string | null;
  image: string;
  category: string;
  status: string;
}

export interface TicketEventDetail extends TicketEventSummary {
  overview: string;
  registrationDeadline: string;
  duration: string | null;
  instructor: string | null;
}

export interface TicketTypeSummary {
  id: string;
  name: string;
  price: number;
  currency: string;
}

export interface Ticket {
  id: string;
  inviteCode: string;
  status: RegistrationStatus;
  registeredAt: string;
  checkedInAt: string | null;
  referralCodeUsed: string | null;
  event: TicketEventSummary;
  ticketType: TicketTypeSummary;
}

export interface TicketDetail extends Omit<Ticket, "event"> {
  event: TicketEventDetail;
}

export interface CheckInResult {
  success: boolean;
  error?: string;
  attendee?: {
    name: string;
    email: string;
    avatar: string | null;
    membershipStatus: string;
  };
  checkedInAt?: string;
}

interface TicketContextType {
  // All tickets list
  tickets: Ticket[];
  ticketsLoading: boolean;
  ticketsError: string | null;
  loadTickets: (status?: RegistrationStatus) => Promise<void>;
  refreshTickets: () => Promise<void>;
  // In TicketContextType interface, add:
  cancelRegistration: (
    registrationId: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Single ticket detail (for QR page)
  currentTicket: TicketDetail | null;
  currentTicketLoading: boolean;
  currentTicketError: string | null;
  loadTicket: (id: string) => Promise<void>;
  clearCurrentTicket: () => void;

  // Check-in (admin / moderator / webmaster)
  checkIn: (inviteCode: string) => Promise<CheckInResult>;
  checkInLoading: boolean;

  clearErrors: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TicketContext = createContext<TicketContextType | undefined>(undefined);

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

export const TicketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, sessionStatus } = useAuth();

  // Tickets list state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [lastStatusFilter, setLastStatusFilter] = useState<
    RegistrationStatus | undefined
  >(undefined);

  // Current ticket state
  const [currentTicket, setCurrentTicket] = useState<TicketDetail | null>(null);
  const [currentTicketLoading, setCurrentTicketLoading] = useState(false);
  const [currentTicketError, setCurrentTicketError] = useState<string | null>(
    null,
  );

  // Check-in state
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Clear state on logout
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      setTickets([]);
      setCurrentTicket(null);
      setTicketsError(null);
      setCurrentTicketError(null);
    }
  }, [sessionStatus]);

  // ── Load all tickets ───────────────────────────────────────────────────────
  const loadTickets = useCallback(
    async (status?: RegistrationStatus) => {
      if (!isAuthenticated) return;
      setTicketsLoading(true);
      setTicketsError(null);
      setLastStatusFilter(status);
      try {
        const params = status ? `?status=${status}` : "";
        const res = await fetch(`/api/tickets${params}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load tickets");
        setTickets(data.tickets);
      } catch (err) {
        setTicketsError(
          err instanceof Error ? err.message : "Failed to load tickets",
        );
      } finally {
        setTicketsLoading(false);
      }
    },
    [isAuthenticated],
  );

  const refreshTickets = useCallback(
    () => loadTickets(lastStatusFilter),
    [loadTickets, lastStatusFilter],
  );

  // ── Load single ticket ─────────────────────────────────────────────────────
  const loadTicket = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      setCurrentTicketLoading(true);
      setCurrentTicketError(null);
      try {
        const res = await fetch(`/api/tickets/${id}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ticket not found");
        setCurrentTicket(data.ticket);
      } catch (err) {
        setCurrentTicketError(
          err instanceof Error ? err.message : "Failed to load ticket",
        );
      } finally {
        setCurrentTicketLoading(false);
      }
    },
    [isAuthenticated],
  );

  const clearCurrentTicket = useCallback(() => setCurrentTicket(null), []);

  // ── Check-in (admin / moderator / webmaster) ───────────────────────────────
  const checkIn = useCallback(
    async (inviteCode: string): Promise<CheckInResult> => {
      setCheckInLoading(true);
      try {
        const res = await fetch("/api/events/check-in", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ inviteCode }),
        });
        const data = await res.json();
        if (!res.ok)
          return { success: false, error: data.error ?? "Check-in failed" };

        // Update local ticket state if loaded
        setCurrentTicket((prev) =>
          prev?.inviteCode === inviteCode
            ? {
                ...prev,
                status: "checked-in",
                checkedInAt: data.registration.checkedInAt,
              }
            : prev,
        );
        setTickets((prev) =>
          prev.map((t) =>
            t.inviteCode === inviteCode
              ? {
                  ...t,
                  status: "checked-in",
                  checkedInAt: data.registration.checkedInAt,
                }
              : t,
          ),
        );

        return {
          success: true,
          attendee: data.attendee,
          checkedInAt: data.registration.checkedInAt,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Check-in failed",
        };
      } finally {
        setCheckInLoading(false);
      }
    },
    [],
  );

  const cancelRegistration = useCallback(
    async (
      registrationId: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/tickets/${registrationId}/cancel`, {
          method: "PATCH",
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok)
          return { success: false, error: data.error ?? "Cancellation failed" };

        // Optimistic update — mark cancelled in both lists
        setTickets((prev) =>
          prev.map((t) =>
            t.id === registrationId ? { ...t, status: "cancelled" } : t,
          ),
        );
        setCurrentTicket((prev) =>
          prev?.id === registrationId ? { ...prev, status: "cancelled" } : prev,
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
    setTicketsError(null);
    setCurrentTicketError(null);
  }, []);

  return (
    <TicketContext.Provider
      value={{
        tickets,
        ticketsLoading,
        ticketsError,
        loadTickets,
        refreshTickets,
        cancelRegistration,
        currentTicket,
        currentTicketLoading,
        currentTicketError,
        loadTicket,
        clearCurrentTicket,
        checkIn,
        checkInLoading,
        clearErrors,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTickets = (): TicketContextType => {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTickets must be used within a TicketProvider");
  return ctx;
};
