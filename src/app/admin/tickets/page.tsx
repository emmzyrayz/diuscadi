"use client";
// app/admin/tickets/page.tsx
// Fetches directly from GET /api/admin/tickets — no AdminContext needed for
// this page since ticket data is local to this view and not shared state.
// loadTickets has been added to AdminContext for pages that need ticket counts
// (e.g. dashboard overview) — see AdminContext.tsx.

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useAdminExport } from "@/hooks/useAdminExport";
import { AdminTicketsHeader } from "@/components/sections/admin/tickets/ATHeader";
import { AdminTicketsStats } from "@/components/sections/admin/tickets/ATStats";
import { AdminTicketsToolbar } from "@/components/sections/admin/tickets/ATToolbar";
import { AdminTicketsTable } from "@/components/sections/admin/tickets/ATTable";
import { AdminTicketsPagination } from "@/components/sections/admin/tickets/ATPagination";
import { AdminTicketsEmptyState } from "@/components/sections/admin/tickets/ATEmptyState";
import { TicketScannerModal } from "@/components/sections/admin/tickets/modal/TicketScannerModal";
import { LuLoader } from "react-icons/lu";
import { cn } from "@/lib/utils";

// Shape returned by GET /api/admin/tickets
export interface AdminTicket {
  id: string;
  inviteCode: string;
  status: string; // "registered" | "checked-in" | "cancelled"
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  checkedInAt: string | null;
  createdAt: string;
  registrationType?: "Account" | "Guest";
}

interface TicketStats {
  total: number;
  active: number;
  checkedIn: number;
  invalidated: number;
}

interface TicketPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 25;

export default function TicketManagementPage() {
  const { token } = useAuth();

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [pagination, setPagination] = useState<TicketPagination | null>(null);
  const [ticketType, setTicketType] = useState<"" | "account" | "guest">("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Export — passes active filters so the CSV matches what admin is viewing
  const { exporting, triggerExport } = useAdminExport({
    route: "/api/admin/tickets",
    filenamePrefix: "diuscadi-tickets",
    loadingMessage: "Exporting tickets…",
    successMessage: "Tickets exported",
  });

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (ticketType) params.set("type", ticketType);

      const res = await fetch(`/api/admin/tickets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setPagination(data.pagination ?? null);
      setStats(data.stats ?? null);
    } catch {
      // silently fail — table stays empty
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, search, status, ticketType]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleMutation = () => fetchTickets();

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full mt-20">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="max-w-[1600px] w-full mt-20 p-5 mx-auto space-y-8"
    >
      <AdminTicketsHeader
        activeTickets={stats?.active ?? 0}
        onScanClick={() => setIsScannerOpen(true)}
        onExportClick={() =>
          triggerExport({ search, status, type: ticketType })
        }
        exporting={exporting}
      />

      <AdminTicketsStats stats={stats} />

      {/* ── Type filter tabs ── */}
      <div className="flex gap-2 p-1 bg-muted border border-border rounded-2xl w-fit">
        {[
          { id: "" as const, label: "All Tickets" },
          { id: "account" as const, label: "Account" },
          { id: "guest" as const, label: "Guest" },
        ].map(({ id, label }) => (
          <button
            key={id === "" ? "all" : id}
            onClick={() => {
              setTicketType(id);
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
              ticketType === id
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <AdminTicketsToolbar
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {tickets.length === 0 && !loading ? (
        <AdminTicketsEmptyState
          isSearchActive={!!(search || status)}
          onReset={() => {
            setSearch("");
            setStatus("");
          }}
        />
      ) : (
        <div className="space-y-6">
          <AdminTicketsTable tickets={tickets} onMutation={handleMutation} />
          {pagination && pagination.totalPages > 1 && (
            <AdminTicketsPagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalTickets={pagination.total}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      <TicketScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={handleMutation}
      />
    </motion.div>
  );
}
