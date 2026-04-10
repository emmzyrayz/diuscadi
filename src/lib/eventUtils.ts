// lib/eventUtils.ts
// Shared event state logic — works directly from EventSummary fields
// already in EventContext. No new fields needed on any interface.

export type EventState =
  | "upcoming"
  | "ongoing"
  | "past"
  | "closed"
  | "soldout"
  | "free"
  | "free-closed";

export interface EventStateInput {
  eventDate: string;
  endDate?: string | null;
  registrationDeadline: string;
  slotsRemaining: number;
  isFree?: boolean;
}

// All fields already exist on EventSummary:
//   eventDate, endDate, registrationDeadline, slotsRemaining
// isFree is derived: ticketTypes.every(t => t.price === 0) || ticketTypes.length === 0

export function getEventState(e: EventStateInput): EventState {
  const now = new Date();
  const start = new Date(e.eventDate);
  const end = e.endDate
    ? new Date(e.endDate)
    : new Date(start.getTime() + 4 * 60 * 60 * 1000); // default +4h
  const deadline = new Date(e.registrationDeadline);

  if (now > end) return "past";
  if (now >= start && now <= end) return "ongoing";
  if (e.slotsRemaining === 0) return "soldout";
  if (now > deadline) return e.isFree ? "free-closed" : "closed";
  if (e.isFree) return "free";
  return "upcoming";
}

// Helper to derive isFree from EventSummary.ticketTypes — no new field needed
export function deriveIsFree(ticketTypes: { price: number }[]): boolean {
  if (!ticketTypes || ticketTypes.length === 0) return true;
  return ticketTypes.every((t) => t.price === 0);
}

export const EVENT_STATE_CONFIG: Record<
  EventState,
  {
    label: string;
    badgeLabel: string;
    btnLabel: string;
    btnDisabled: boolean;
    badgeBg: string;
    badgeText: string;
  }
> = {
  upcoming: {
    label: "Upcoming",
    badgeLabel: "Upcoming",
    btnLabel: "Register Now",
    btnDisabled: false,
    badgeBg: "bg-primary",
    badgeText: "text-background",
  },
  ongoing: {
    label: "Happening Now",
    badgeLabel: "Ongoing",
    btnLabel: "Register Now",
    btnDisabled: false,
    badgeBg: "bg-emerald-500",
    badgeText: "text-background",
  },
  free: {
    label: "Free Entry",
    badgeLabel: "Free",
    btnLabel: "Claim Free Seat",
    btnDisabled: false,
    badgeBg: "bg-emerald-500",
    badgeText: "text-background",
  },
  "free-closed": {
    label: "Registration Closed",
    badgeLabel: "Closed",
    btnLabel: "Registration Closed",
    btnDisabled: true,
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
  },
  soldout: {
    label: "Sold Out",
    badgeLabel: "Sold Out",
    btnLabel: "Sold Out",
    btnDisabled: true,
    badgeBg: "bg-rose-500",
    badgeText: "text-background",
  },
  closed: {
    label: "Registration Closed",
    badgeLabel: "Closed",
    btnLabel: "Registration Closed",
    btnDisabled: true,
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
  },
  past: {
    label: "Event Ended",
    badgeLabel: "Past",
    btnLabel: "Event Has Ended",
    btnDisabled: true,
    badgeBg: "bg-slate-200",
    badgeText: "text-slate-500",
  },
};


