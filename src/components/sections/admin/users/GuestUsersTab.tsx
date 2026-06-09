"use client";
// GuestUsersTab.tsx — guest registrations table for the admin users page.
// Fetches from GET /api/admin/guests and mirrors the style of the platform users table.

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LuSearch,
  LuDownload,
  LuLoader,
  LuBadgeCheck,
  LuUsers,
  LuRefreshCw,
  LuCircleCheck,
  LuClock,
  LuBan,
  LuTicket,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface GuestRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: { countryCode: number; phoneNumber: number };
  inviteCode: string;
  status: string;
  registeredAt: string;
  checkedInAt: string | null;
  verifiedAt: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string | null;
  eventFormat: string;
}

interface GuestStats {
  total: number;
  registered: number;
  checkedIn: number;
  cancelled: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  registered: {
    label: "Registered",
    cls: "bg-blue-50 text-blue-600 border-blue-100",
  },
  "checked-in": {
    label: "Checked In",
    cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-rose-50 text-rose-600 border-rose-100",
  },
};

const PAGE_SIZE = 25;

export const GuestUsersTab: React.FC = () => {
  const { token } = useAuth();

  const [guests, setGuests] = useState<GuestRegistration[]>([]);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchGuests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/guests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load guest registrations");
      const data = await res.json();
      setGuests(data.guests ?? []);
      setStats(data.stats ?? null);
      setPagination(data.pagination ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load guests");
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, search, statusFilter]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const handleExport = async () => {
    if (!token || exporting) return;
    setExporting(true);
    try {
      const params = new URLSearchParams({ export: "csv" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/guests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diuscadi-guests-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Guest list exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Guests",
            value: stats?.total ?? 0,
            icon: LuUsers,
            color: "text-foreground",
          },
          {
            label: "Registered",
            value: stats?.registered ?? 0,
            icon: LuTicket,
            color: "text-blue-600",
          },
          {
            label: "Checked In",
            value: stats?.checkedIn ?? 0,
            icon: LuBadgeCheck,
            color: "text-emerald-600",
          },
          {
            label: "Cancelled",
            value: stats?.cancelled ?? 0,
            icon: LuBan,
            color: "text-rose-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-background border-2 border-border rounded-[2rem] p-5 space-y-1"
          >
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              {label}
            </p>
            <div className="flex items-center gap-2">
              <Icon className={cn("w-4 h-4", color)} />
              <p className={cn("text-3xl font-black", color)}>
                {value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-muted border border-border rounded-xl px-3 py-2 flex-1 max-w-xs">
          <LuSearch className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search name, email, code…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none"
        >
          <option value="">All Statuses</option>
          <option value="registered">Registered</option>
          <option value="checked-in">Checked In</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={fetchGuests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-foreground transition-all cursor-pointer disabled:opacity-60"
        >
          <LuRefreshCw
            className={cn("w-3.5 h-3.5", loading && "animate-spin")}
          />
          Refresh
        </button>

        <button
          onClick={handleExport}
          disabled={exporting || (stats?.total ?? 0) === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all cursor-pointer disabled:opacity-60"
        >
          {exporting ? (
            <LuLoader className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LuDownload className="w-3.5 h-3.5" />
          )}
          Export CSV
        </button>
      </div>

      {/* ── Table ── */}
      {loading && guests.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <LuLoader className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : guests.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <LuUsers className="w-10 h-10 text-slate-200 mx-auto" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {search || statusFilter
              ? "No guests match your filters"
              : "No guest registrations yet"}
          </p>
        </div>
      ) : (
        <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {[
                    "Guest",
                    "Event",
                    "Ticket Code",
                    "Status",
                    "Registered",
                    "Checked In",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {guests.map((g, i) => {
                  const badge = STATUS_BADGE[g.status] ?? {
                    label: g.status,
                    cls: "bg-muted text-muted-foreground",
                  };
                  return (
                    <motion.tr
                      key={g.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className="group hover:bg-muted/30 transition-all"
                    >
                      {/* Guest */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center font-black text-muted-foreground text-sm shrink-0">
                            {g.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground">
                              {g.firstName} {g.lastName}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground">
                              {g.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Event */}
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-bold text-foreground line-clamp-2 max-w-[180px]">
                          {g.eventTitle}
                        </p>
                        {g.eventDate && (
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">
                            {formatDate(g.eventDate)}
                          </p>
                        )}
                      </td>

                      {/* Ticket code */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-black text-foreground bg-muted px-2 py-0.5 rounded-lg">
                          {g.inviteCode}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            badge.cls,
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Registered */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <LuClock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {formatDate(g.registeredAt)}
                          </span>
                        </div>
                      </td>

                      {/* Checked in */}
                      <td className="px-4 py-3">
                        {g.checkedInAt ? (
                          <div className="flex items-center gap-1.5">
                            <LuCircleCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-600">
                              {formatDate(g.checkedInAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-300">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || loading}
                  className="px-3 py-1.5 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:border-foreground transition-all cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="px-3 py-1.5 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:border-foreground transition-all cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
