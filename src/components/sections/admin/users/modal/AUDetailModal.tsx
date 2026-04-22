"use client";
// modal/AUDetailModal.tsx
// Read-only user profile viewer.
// Tabs:
//   info     — static from AdminUser prop (no fetch needed)
//   tickets  — GET /api/admin/users/[id]/tickets
//   events   — GET /api/admin/users/[id]/events
//   activity — Account Timeline derived from AdminUser data (no fetch needed)

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCircleCheck,
  LuHash,
  LuMail,
  LuGraduationCap,
  LuCalendarDays,
  LuTicket,
  LuCalendar,
  LuActivity,
  LuShieldCheck,
  LuLoader,
  LuCircleAlert,
  LuCheckCheck,
  LuCircleX,
  LuClock,
  LuUserCheck,
  LuUsers,
  LuMapPin,
  LuCalendarCheck,
  LuBadgeCheck,
  LuClipboardList,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import {
  resolveAvatarUrl,
  type AdminUser,
  useAdmin,
  type AdminUserTicket,
  type AdminUserEvent,
  type AdminUserActivity,
} from "@/context/AdminContext";
import {
  resolveAdminFullName,
  resolveAdminInitial,
} from "@/utils/adminFullName";
import { IconType } from "react-icons";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

type TabType = "info" | "tickets" | "events" | "activity";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
  onMutation?: () => void;
}

// ── Ticket shape from /api/admin/users/[id]/tickets ───────────────────────────
interface UserTicket {
  id: string;
  inviteCode: string;
  status: string;
  registeredAt: string;
  checkedInAt: string | null;
  eventId: string;
  eventTitle: string;
  eventDate: string | null;
  eventFormat: string;
  ticketTypeName: string;
  ticketPrice: number;
  ticketCurrency: string;
}

// ── Event shape from /api/admin/users/[id]/events ─────────────────────────────
interface UserEvent {
  registrationId: string;
  registrationStatus: string;
  registeredAt: string;
  checkedInAt: string | null;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string | null;
  eventFormat: string;
  eventCategory: string;
  eventStatus: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Africa/Lagos",
    });
  } catch {
    return "—";
  }
}

function ticketStatusStyle(status: string): string {
  switch (status) {
    case "checked-in": return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "cancelled":  return "bg-rose-50 text-rose-600 border-rose-100";
    case "registered": return "bg-blue-50 text-blue-600 border-blue-100";
    default:           return "bg-muted text-muted-foreground border-border";
  }
}

function ticketStatusLabel(status: string): string {
  switch (status) {
    case "checked-in": return "Attended";
    case "cancelled":  return "Cancelled";
    case "registered": return "Registered";
    default:           return status;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export const AdminUserDetailsModal: React.FC<Props> = ({ isOpen, onClose, user }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("info");

  // ── Ticket tab state ───────────────────────────────────────────────────────
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);

  // ── Events tab state ───────────────────────────────────────────────────────
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  const { loadUserTickets, loadUserEvents, loadUserActivity } = useAdmin();

  const [userTickets, setUserTickets] = useState<AdminUserTicket[]>([]);
  const [userTicketsPagination, setUserTicketsPagination] = useState<{
    page: number;
    totalPages: number;
  } | null>(null);
  const [userTicketsLoading, setUserTicketsLoading] = useState(false);

  const [userEvents, setUserEvents] = useState<AdminUserEvent[]>([]);
  const [userEventsPagination, setUserEventsPagination] = useState<{
    page: number;
    totalPages: number;
  } | null>(null);
  const [userEventsLoading, setUserEventsLoading] = useState(false);

  const [userActivity, setUserActivity] = useState<AdminUserActivity[]>([]);
  const [userActivityLoading, setUserActivityLoading] = useState(false);

  const avatarSrc = resolveAvatarUrl(user.avatar?.imageUrl);
  const isActive = user.isAccountActive;
  const statusLabel =
    !isActive && user.membershipStatus === "banned"
      ? "Banned"
      : !isActive
        ? "Suspended"
        : "Active";
  const statusStyle =
    !isActive && user.membershipStatus === "banned"
      ? "bg-rose-50 text-rose-600 border-rose-100"
      : !isActive
        ? "bg-amber-50 text-amber-600 border-amber-100"
        : "bg-emerald-50 text-emerald-600 border-emerald-100";

  // Reset on user change
  useEffect(() => {
    setActiveTab("info");
    setTickets([]);
    setTicketsLoaded(false);
    setTicketsError(null);
    setEvents([]);
    setEventsLoaded(false);
    setEventsError(null);
  }, [user.id]);

  // Fetch on tab change
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === "tickets" && userTickets.length === 0) {
      setUserTicketsLoading(true);
      loadUserTickets(user.id, 1, token ?? undefined).then((res) => {
        if (res) {
          setUserTickets(res.tickets);
          setUserTicketsPagination(res.pagination);
        }
        setUserTicketsLoading(false);
      });
    }
    if (activeTab === "events" && userEvents.length === 0) {
      setUserEventsLoading(true);
      loadUserEvents(user.id, 1, token ?? undefined).then((res) => {
        if (res) {
          setUserEvents(res.events);
          setUserEventsPagination(res.pagination);
        }
        setUserEventsLoading(false);
      });
    }
    if (activeTab === "activity" && userActivity.length === 0) {
      setUserActivityLoading(true);
      loadUserActivity(user.id, token ?? undefined).then((res) => {
        if (res) setUserActivity(res);
        setUserActivityLoading(false);
      });
    }
  }, [activeTab, isOpen, loadUserActivity, loadUserEvents, loadUserTickets, token, user.id, userActivity.length, userEvents.length, userTickets.length]);

  // ── Fetch tickets (lazy — only when tab is first opened) ───────────────────
  const fetchTickets = useCallback(async () => {
    if (!token || ticketsLoaded) return;
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/tickets?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load tickets");
      setTickets(data.tickets ?? []);
      setTicketsLoaded(true);
    } catch (err) {
      setTicketsError(
        err instanceof Error ? err.message : "Failed to load tickets",
      );
    } finally {
      setTicketsLoading(false);
    }
  }, [token, user.id, ticketsLoaded]);

  // ── Fetch events (lazy — only when tab is first opened) ────────────────────
  const fetchEvents = useCallback(async () => {
    if (!token || eventsLoaded) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load events");
      setEvents(data.events ?? []);
      setEventsLoaded(true);
    } catch (err) {
      setEventsError(
        err instanceof Error ? err.message : "Failed to load events",
      );
    } finally {
      setEventsLoading(false);
    }
  }, [token, user.id, eventsLoaded]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "tickets") fetchTickets();
    if (tab === "events") fetchEvents();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-[100]",
            "flex",
            "items-center",
            "justify-center",
            "p-4",
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn(
              "absolute",
              "inset-0",
              "bg-foreground/80",
              "backdrop-blur-sm",
            )}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative",
              "w-full",
              "max-w-5xl",
              "bg-background",
              "rounded-[3rem]",
              "shadow-2xl",
              "overflow-hidden",
              "flex",
              "flex-col",
              "max-h-[90vh]",
            )}
          >
            <button
              onClick={onClose}
              className={cn(
                "absolute",
                "top-6",
                "right-6",
                "p-3",
                "bg-muted",
                "rounded-full",
                "text-muted-foreground",
                "hover:text-foreground",
                "transition-colors",
                "z-10",
                "cursor-pointer",
              )}
            >
              <LuX className={cn("w-5", "h-5")} />
            </button>

            <div
              className={cn(
                "flex",
                "flex-col",
                "lg:flex-row",
                "h-full",
                "overflow-hidden",
              )}
            >
              {/* ── Left sidebar ─────────────────────────────────────────── */}
              <div
                className={cn(
                  "w-full",
                  "lg:w-1/3",
                  "bg-muted",
                  "p-10",
                  "border-r",
                  "border-border",
                  "overflow-y-auto",
                )}
              >
                <div
                  className={cn(
                    "flex",
                    "flex-col",
                    "items-center",
                    "text-center",
                    "space-y-4",
                  )}
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "w-28",
                        "h-28",
                        "rounded-[2rem]",
                        "bg-slate-200",
                        "overflow-hidden",
                        "border-4",
                        "border-background",
                        "shadow-lg",
                        "flex",
                        "items-center",
                        "justify-center",
                        "text-4xl",
                        "font-black",
                        "text-muted-foreground",
                      )}
                    >
                      {avatarSrc ? (
                        <Image
                          height={300}
                          width={500}
                          src={avatarSrc}
                          alt={resolveAdminFullName(user.fullName)}
                          className={cn("w-full", "h-full", "object-cover")}
                        />
                      ) : (
                        <span>{resolveAdminInitial(user.fullName)}</span>
                      )}
                    </div>
                    {user.isEmailVerified && (
                      <div
                        className={cn(
                          "absolute",
                          "-bottom-2",
                          "-right-2",
                          "bg-emerald-500",
                          "text-background",
                          "p-1.5",
                          "rounded-xl",
                          "border-4",
                          "border-muted",
                          "shadow-sm",
                        )}
                      >
                        <LuCircleCheck className={cn("w-4", "h-4")} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2
                      className={cn(
                        "text-2xl",
                        "font-black",
                        "text-foreground",
                        "tracking-tight",
                      )}
                    >
                      {resolveAdminFullName(user.fullName)}
                    </h2>
                    <div
                      className={cn(
                        "flex",
                        "items-center",
                        "justify-center",
                        "gap-2",
                        "mt-2",
                      )}
                    >
                      <span
                        className={cn(
                          "px-3",
                          "py-1",
                          "bg-primary/10",
                          "text-primary",
                          "rounded-lg",
                          "text-[10px]",
                          "font-black",
                          "uppercase",
                          "tracking-widest",
                          "flex",
                          "items-center",
                          "gap-1",
                        )}
                      >
                        <LuHash className={cn("w-3", "h-3")} />{" "}
                        {user.vaultId.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={cn(
                          "px-3",
                          "py-1",
                          "rounded-full",
                          "border",
                          "text-[8px]",
                          "font-black",
                          "uppercase",
                          "tracking-widest",
                          statusStyle,
                        )}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-8",
                    "pt-8",
                    "border-t",
                    "border-border/60",
                    "space-y-6",
                  )}
                >
                  <InfoRow icon={LuMail} label="Email" value={user.email} />
                  <InfoRow
                    icon={LuShieldCheck}
                    label="Role"
                    value={user.role}
                  />
                  <InfoRow
                    icon={LuGraduationCap}
                    label="Edu Status"
                    value={user.eduStatus}
                  />
                  <InfoRow
                    icon={LuCalendarDays}
                    label="Member Since"
                    value={new Date(user.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  />
                  {user.lastLoginAt && (
                    <InfoRow
                      icon={LuActivity}
                      label="Last Login"
                      value={new Date(user.lastLoginAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    />
                  )}
                </div>
              </div>

              {/* ── Right tabs ────────────────────────────────────────────── */}
              <div
                className={cn(
                  "w-full",
                  "lg:w-2/3",
                  "flex",
                  "flex-col",
                  "bg-background",
                )}
              >
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-6",
                    "px-10",
                    "pt-10",
                    "border-b",
                    "border-border",
                    "overflow-x-auto",
                  )}
                >
                  {(
                    [
                      {
                        id: "info",
                        label: "Account Info",
                        icon: LuGraduationCap,
                      },
                      {
                        id: "tickets",
                        label: `Tickets (${user.analytics.eventsRegistered})`,
                        icon: LuTicket,
                      },
                      {
                        id: "events",
                        label: `Events (${user.analytics.eventsAttended})`,
                        icon: LuCalendar,
                      },
                      { id: "activity", label: "Timeline", icon: LuActivity },
                    ] as { id: TabType; label: string; icon: IconType }[]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "flex",
                        "items-center",
                        "gap-2",
                        "pb-4",
                        "border-b-2",
                        "transition-colors",
                        "whitespace-nowrap",
                        "cursor-pointer",
                        activeTab === tab.id
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-slate-600",
                      )}
                    >
                      <tab.icon className={cn("w-4", "h-4")} />
                      <span
                        className={cn(
                          "text-[11px]",
                          "font-black",
                          "uppercase",
                          "tracking-widest",
                        )}
                      >
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className={cn("flex-1", "overflow-y-auto", "p-10")}>
                  <AnimatePresence mode="wait">
                    {/* ── Info tab ───────────────────────────────────────── */}
                    {activeTab === "info" && (
                      <motion.div
                        key="info"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className={cn("space-y-8")}
                      >
                        <h3
                          className={cn(
                            "text-[11px]",
                            "font-black",
                            "uppercase",
                            "tracking-[0.2em]",
                            "text-muted-foreground",
                            "border-b",
                            "border-border",
                            "pb-4",
                          )}
                        >
                          Account Information
                        </h3>
                        <div className={cn("grid", "grid-cols-2", "gap-8")}>
                          <InfoBlock
                            icon={LuHash}
                            label="Vault ID"
                            value={user.vaultId}
                          />
                          <InfoBlock
                            icon={LuShieldCheck}
                            label="Platform Role"
                            value={user.role}
                          />
                          <InfoBlock
                            icon={LuGraduationCap}
                            label="Education"
                            value={user.eduStatus}
                          />
                          <InfoBlock
                            icon={LuTicket}
                            label="Events Registered"
                            value={String(user.analytics.eventsRegistered)}
                          />
                          <InfoBlock
                            icon={LuActivity}
                            label="Events Attended"
                            value={String(user.analytics.eventsAttended)}
                          />
                          <InfoBlock
                            icon={LuCircleCheck}
                            label="Email Verified"
                            value={user.isEmailVerified ? "Yes" : "No"}
                          />
                          {user.committee && (
                            <InfoBlock
                              icon={LuShieldCheck}
                              label="Committee"
                              value={user.committee}
                            />
                          )}
                          {user.skills?.length > 0 && (
                            <div className={cn("col-span-2", "space-y-2")}>
                              <p
                                className={cn(
                                  "text-[9px]",
                                  "font-black",
                                  "text-muted-foreground",
                                  "uppercase",
                                  "tracking-widest",
                                )}
                              >
                                Skills
                              </p>
                              <div className={cn("flex", "flex-wrap", "gap-2")}>
                                {user.skills.map((s) => (
                                  <span
                                    key={s}
                                    className={cn(
                                      "px-2",
                                      "py-1",
                                      "bg-primary/10",
                                      "text-primary",
                                      "rounded-lg",
                                      "text-[9px]",
                                      "font-black",
                                      "uppercase",
                                    )}
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* ── TICKETS TAB ─────────────────────────────────────────── */}
                    {activeTab === "tickets" && (
                      <motion.div
                        key="tickets"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-4">
                          Ticket History ({user.analytics.eventsRegistered}{" "}
                          total)
                        </h3>
                        {userTicketsLoading ? (
                          <div className="flex justify-center py-12">
                            <LuLoader className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : userTickets.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                            <LuTicket className="w-8 h-8 text-slate-300" />
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                              No tickets found
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userTickets.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-start justify-between p-4 bg-muted rounded-2xl gap-4"
                              >
                                <div className="space-y-1 flex-1 min-w-0">
                                  <p className="text-xs font-black text-foreground truncate">
                                    {t.eventTitle}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                    <LuCalendarDays className="w-3 h-3" />
                                    {t.eventDate
                                      ? new Date(
                                          t.eventDate,
                                        ).toLocaleDateString("en-NG", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                      : "—"}
                                  </div>
                                  <p className="text-[10px] font-mono text-slate-400 uppercase">
                                    {t.inviteCode}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <span
                                    className={cn(
                                      "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                      t.status === "checked-in"
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : t.status === "cancelled"
                                          ? "bg-rose-50 text-rose-600 border-rose-100"
                                          : "bg-blue-50 text-blue-600 border-blue-100",
                                    )}
                                  >
                                    {t.status}
                                  </span>
                                  <span className="text-[9px] font-bold text-muted-foreground">
                                    {t.ticketTypeName}
                                  </span>
                                  <span className="text-[9px] font-bold text-muted-foreground">
                                    {t.ticketTypePrice === 0
                                      ? "Free"
                                      : `₦${t.ticketTypePrice.toLocaleString()}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {userTicketsPagination &&
                              userTicketsPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between pt-2">
                                  <button
                                    disabled={userTicketsPagination.page <= 1}
                                    onClick={() => {
                                      const nextPage =
                                        userTicketsPagination.page - 1;
                                      setUserTicketsLoading(true);
                                      loadUserTickets(
                                        user.id,
                                        nextPage,
                                        token ?? undefined,
                                      ).then((res) => {
                                        if (res) {
                                          setUserTickets(res.tickets);
                                          setUserTicketsPagination(
                                            res.pagination,
                                          );
                                        }
                                        setUserTicketsLoading(false);
                                      });
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    ← Prev
                                  </button>
                                  <span className="text-[10px] font-bold text-muted-foreground">
                                    Page {userTicketsPagination.page} of{" "}
                                    {userTicketsPagination.totalPages}
                                  </span>
                                  <button
                                    disabled={
                                      userTicketsPagination.page >=
                                      userTicketsPagination.totalPages
                                    }
                                    onClick={() => {
                                      const nextPage =
                                        userTicketsPagination.page + 1;
                                      setUserTicketsLoading(true);
                                      loadUserTickets(
                                        user.id,
                                        nextPage,
                                        token ?? undefined,
                                      ).then((res) => {
                                        if (res) {
                                          setUserTickets(res.tickets);
                                          setUserTicketsPagination(
                                            res.pagination,
                                          );
                                        }
                                        setUserTicketsLoading(false);
                                      });
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    Next →
                                  </button>
                                </div>
                              )}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── EVENTS TAB ───────────────────────────────────────────── */}
                    {activeTab === "events" && (
                      <motion.div
                        key="events"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-4">
                          Events Attended ({user.analytics.eventsAttended}{" "}
                          total)
                        </h3>
                        {userEventsLoading ? (
                          <div className="flex justify-center py-12">
                            <LuLoader className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : userEvents.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                            <LuCalendar className="w-8 h-8 text-slate-300" />
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                              No events attended yet
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userEvents.map((e) => (
                              <div
                                key={e.id}
                                className="flex items-start justify-between p-4 bg-muted rounded-2xl gap-4"
                              >
                                <div className="space-y-1 flex-1 min-w-0">
                                  <p className="text-xs font-black text-foreground truncate">
                                    {e.eventTitle}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                    <LuCalendarDays className="w-3 h-3" />
                                    {e.eventDate
                                      ? new Date(
                                          e.eventDate,
                                        ).toLocaleDateString("en-NG", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                      : "—"}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                    <LuMapPin className="w-3 h-3" />{" "}
                                    {e.eventFormat}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1">
                                    <LuCalendarCheck className="w-3 h-3" />{" "}
                                    Attended
                                  </span>
                                  {e.checkedInAt && (
                                    <span className="text-[9px] font-bold text-muted-foreground">
                                      {new Date(
                                        e.checkedInAt,
                                      ).toLocaleTimeString("en-NG", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                      WAT
                                    </span>
                                  )}
                                  <span className="text-[9px] font-bold text-muted-foreground capitalize">
                                    {e.eventCategory}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {userEventsPagination &&
                              userEventsPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between pt-2">
                                  <button
                                    disabled={userEventsPagination.page <= 1}
                                    onClick={() => {
                                      const nextPage =
                                        userEventsPagination.page - 1;
                                      setUserEventsLoading(true);
                                      loadUserEvents(
                                        user.id,
                                        nextPage,
                                        token ?? undefined,
                                      ).then((res) => {
                                        if (res) {
                                          setUserEvents(res.events);
                                          setUserEventsPagination(
                                            res.pagination,
                                          );
                                        }
                                        setUserEventsLoading(false);
                                      });
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    ← Prev
                                  </button>
                                  <span className="text-[10px] font-bold text-muted-foreground">
                                    Page {userEventsPagination.page} of{" "}
                                    {userEventsPagination.totalPages}
                                  </span>
                                  <button
                                    disabled={
                                      userEventsPagination.page >=
                                      userEventsPagination.totalPages
                                    }
                                    onClick={() => {
                                      const nextPage =
                                        userEventsPagination.page + 1;
                                      setUserEventsLoading(true);
                                      loadUserEvents(
                                        user.id,
                                        nextPage,
                                        token ?? undefined,
                                      ).then((res) => {
                                        if (res) {
                                          setUserEvents(res.events);
                                          setUserEventsPagination(
                                            res.pagination,
                                          );
                                        }
                                        setUserEventsLoading(false);
                                      });
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    Next →
                                  </button>
                                </div>
                              )}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── ACTIVITY TAB ─────────────────────────────────────────── */}
                    {activeTab === "activity" && (
                      <motion.div
                        key="activity"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-4">
                          Activity Log
                        </h3>
                        {userActivityLoading ? (
                          <div className="flex justify-center py-12">
                            <LuLoader className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : userActivity.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                            <LuActivity className="w-8 h-8 text-slate-300" />
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                              No activity recorded
                            </p>
                          </div>
                        ) : (
                          <div className="relative space-y-0">
                            {/* Timeline line */}
                            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
                            {userActivity.map((a, i) => {
                              const iconMap: Record<string, React.ElementType> =
                                {
                                  registration: LuTicket,
                                  "check-in": LuCalendarCheck,
                                  application: LuClipboardList,
                                };
                              const colorMap: Record<string, string> = {
                                registration: "bg-blue-100 text-blue-600",
                                "check-in": "bg-emerald-100 text-emerald-600",
                                application: "bg-amber-100 text-amber-600",
                              };
                              const Icon = iconMap[a.type] ?? LuActivity;
                              return (
                                <div
                                  key={i}
                                  className="flex items-start gap-4 pl-10 pb-5 relative"
                                >
                                  {/* Dot */}
                                  <div
                                    className={cn(
                                      "absolute left-2 top-1 w-4 h-4 rounded-full flex items-center justify-center -translate-x-1/2",
                                      colorMap[a.type] ??
                                        "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    <Icon className="w-2.5 h-2.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-foreground">
                                      {a.label}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span
                                        className={cn(
                                          "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                          a.status === "checked-in" ||
                                            a.status === "approved"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : a.status === "cancelled" ||
                                                a.status === "rejected"
                                              ? "bg-rose-50 text-rose-600"
                                              : "bg-blue-50 text-blue-600",
                                        )}
                                      >
                                        {a.status}
                                      </span>
                                      <span className="text-[9px] font-bold text-muted-foreground">
                                        {new Date(
                                          a.timestamp,
                                        ).toLocaleDateString("en-NG", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};;

// ── Sub-components ────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: IconType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className={cn("flex", "items-center", "gap-4")}>
    <div
      className={cn(
        "w-10", "h-10", "rounded-xl",
        "bg-background", "border", "border-border",
        "flex", "items-center", "justify-center", "shrink-0",
      )}
    >
      <Icon className={cn("w-4", "h-4", "text-muted-foreground")} />
    </div>
    <div>
      <p className={cn("text-[9px]", "font-black", "text-muted-foreground", "uppercase", "tracking-widest")}>
        {label}
      </p>
      <p className={cn("text-xs", "font-bold", "text-foreground", "truncate", "max-w-[200px]")}>
        {value || "—"}
      </p>
    </div>
  </div>
);

const InfoBlock: React.FC<{ icon: IconType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className={cn("space-y-2")}>
    <div className={cn("flex", "items-center", "gap-2", "text-muted-foreground")}>
      <Icon className={cn("w-4", "h-4")} />
      <span className={cn("text-[9px]", "font-black", "uppercase", "tracking-widest")}>
        {label}
      </span>
    </div>
    <p className={cn("text-sm", "font-bold", "text-foreground", "capitalize")}>
      {value || "—"}
    </p>
  </div>
);