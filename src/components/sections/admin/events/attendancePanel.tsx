"use client";
// components/sections/admin/events/AttendancePanel.tsx
// Live attendance counter + attendee list + CSV download
// Used inside admin event detail view

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LuUsers,
  LuDownload,
  LuLoader,
  LuBadgeCheck,
  LuRefreshCw,
  LuBuilding2,
  LuGraduationCap,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface Attendee {
  "#": number;
  "Full Name": string;
  Email: string;
  Phone: string;
  Membership: string;
  Institution: string;
  Faculty: string;
  Department: string;
  Level: string;
  "Invite Code": string;
  "Checked In At": string;
}

interface AttendanceData {
  eventId: string;
  eventTitle: string;
  checkedIn: number;
  totalRegistered: number;
  capacity: number | null;
  attendees: Attendee[];
}

interface Props {
  eventId: string;
  autoRefresh?: boolean; // poll every 30s while event is live
}

export const AttendancePanel: React.FC<Props> = ({
  eventId,
  autoRefresh = false,
}) => {
  const { token } = useAuth();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAttendance = useCallback(async () => {
    if (!token || !eventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setData(json);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load attendance",
      );
    } finally {
      setLoading(false);
    }
  }, [token, eventId]);

  // Initial load
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Optional polling for live events
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchAttendance, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAttendance]);

  // CSV download
  const handleDownload = async () => {
    if (!token || !eventId) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/admin/events/${eventId}/attendance?format=csv`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const filename = `attendance-${eventId}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Attendance list downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // Search filter
  const filtered = (data?.attendees ?? []).filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a["Full Name"].toLowerCase().includes(q) ||
      a["Email"].toLowerCase().includes(q) ||
      a["Institution"].toLowerCase().includes(q) ||
      a["Department"].toLowerCase().includes(q) ||
      a["Invite Code"].toLowerCase().includes(q)
    );
  });

  // ── Stat derived values ────────────────────────────────────────────────────
  const checkedIn = data?.checkedIn ?? 0;
  const totalRegistered = data?.totalRegistered ?? 0;
  const capacity = data?.capacity;
  const pct =
    totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Checked in */}
        <div className="bg-background border-2 border-border rounded-[2rem] p-5 space-y-1">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            Checked In
          </p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-emerald-600">{checkedIn}</p>
            {totalRegistered > 0 && (
              <p className="text-[11px] font-bold text-muted-foreground mb-1">
                / {totalRegistered} registered
              </p>
            )}
          </div>
          {/* Attendance bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-1.5 bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[9px] font-bold text-muted-foreground">
            {pct}% attendance rate
          </p>
        </div>

        {/* Registered */}
        <div className="bg-background border-2 border-border rounded-[2rem] p-5 space-y-1">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            Registered
          </p>
          <p className="text-3xl font-black text-foreground">
            {totalRegistered}
          </p>
          {capacity && (
            <p className="text-[9px] font-bold text-muted-foreground">
              of {capacity} capacity
            </p>
          )}
        </div>

        {/* Absent */}
        <div className="bg-background border-2 border-border rounded-[2rem] p-5 space-y-1 hidden sm:block">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            Not Checked In
          </p>
          <p className="text-3xl font-black text-amber-500">
            {Math.max(0, totalRegistered - checkedIn)}
          </p>
          <p className="text-[9px] font-bold text-muted-foreground">
            registered but absent
          </p>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-muted border border-border rounded-xl px-3 py-2 flex-1 max-w-xs">
          <LuUsers className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendees…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={fetchAttendance}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-foreground transition-all cursor-pointer disabled:opacity-60"
        >
          <LuRefreshCw
            className={cn("w-3.5 h-3.5", loading && "animate-spin")}
          />
          Refresh
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading || checkedIn === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all cursor-pointer disabled:opacity-60"
        >
          {downloading ? (
            <LuLoader className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LuDownload className="w-3.5 h-3.5" />
          )}
          Export CSV
        </button>
      </div>

      {/* ── Attendee table ── */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-16">
          <LuLoader className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <LuBadgeCheck className="w-10 h-10 text-slate-200 mx-auto" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {search ? "No attendees match your search" : "No check-ins yet"}
          </p>
        </div>
      ) : (
        <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {[
                    "#",
                    "Name",
                    "Institution",
                    "Faculty / Dept",
                    "Level",
                    "Checked In",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                        i === 0 && "w-10",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a, index) => (
                  <motion.tr
                    key={a["Invite Code"]}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="group hover:bg-muted/30 transition-all"
                  >
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {a["#"]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                        {a["Full Name"]}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground">
                        {a["Email"]}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {a["Institution"] ? (
                        <div className="flex items-center gap-1.5">
                          <LuBuilding2 className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-[11px] font-bold text-foreground truncate max-w-[160px]">
                            {a["Institution"]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a["Faculty"] || a["Department"] ? (
                        <div className="space-y-0.5">
                          {a["Faculty"] && (
                            <p className="text-[10px] font-bold text-muted-foreground">
                              {a["Faculty"]}
                            </p>
                          )}
                          {a["Department"] && (
                            <div className="flex items-center gap-1">
                              <LuGraduationCap className="w-2.5 h-2.5 text-muted-foreground" />
                              <p className="text-[9px] font-bold text-muted-foreground">
                                {a["Department"]}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a["Level"] ? (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[8px] font-black uppercase tracking-widest">
                          {a["Level"]}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <LuBadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600">
                          {a["Checked In At"]}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              Showing {filtered.length} of {data?.checkedIn ?? 0} attendees
              {search && ` matching "${search}"`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
