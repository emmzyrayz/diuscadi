"use client";
// context/TicketContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/authFetch";
import type { RegistrationStatus } from "@/lib/models/EventRegistration";

// ─── Types ──────────────────────────────────────────────────────────────────── (unchanged)

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
  whatsappGroupLink?: string | null;
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
  tickets: Ticket[];
  ticketsLoading: boolean;
  ticketsError: string | null;
  loadTickets: (status?: RegistrationStatus) => Promise<void>;
  refreshTickets: () => Promise<void>;
  cancelRegistration: (
    registrationId: string,
  ) => Promise<{ success: boolean; error?: string }>;

  currentTicket: TicketDetail | null;
  currentTicketLoading: boolean;
  currentTicketError: string | null;
  loadTicket: (id: string) => Promise<void>;
  clearCurrentTicket: () => void;

  checkIn: (inviteCode: string) => Promise<CheckInResult>;
  checkInLoading: boolean;

  clearErrors: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TicketContext = createContext<TicketContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const TicketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, sessionStatus } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [lastStatusFilter, setLastStatusFilter] = useState<RegistrationStatus | undefined > (undefined);

  const [currentTicket, setCurrentTicket] = useState<TicketDetail | null>(null);
  const [currentTicketLoading, setCurrentTicketLoading] = useState(false);
  const [currentTicketError, setCurrentTicketError] = useState<string | null>(
    null,
  );

  const [checkInLoading, setCheckInLoading] = useState(false);

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
        const data = await authFetch<{ tickets: Ticket[] }>(
          `/api/tickets${params}`,
        );
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
        const data = await authFetch<{ ticket: TicketDetail }>(
          `/api/tickets/${id}`,
        );
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
  // NOTE: does not use authFetch's throw-on-non-OK behavior directly, because
  // callers expect a { success: false, error } result for expected failure
  // cases (already checked in, cancelled, outside time window) rather than a
  // thrown exception. authFetch still fires the 401 signal internally before
  // throwing, so session expiry is caught the same way — we just catch the
  // throw here and translate it into the existing CheckInResult shape.
  const checkIn = useCallback(
    async (inviteCode: string): Promise<CheckInResult> => {
      setCheckInLoading(true);
      try {
        const data = await authFetch<{
          attendee: CheckInResult["attendee"];
          registration: { checkedInAt: string };
        }>("/api/events/check-in", {
          method: "POST",
          body: JSON.stringify({ inviteCode }),
        });

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
        await authFetch(`/api/events/register/${registrationId}`, {
          method: "DELETE",
        });

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
