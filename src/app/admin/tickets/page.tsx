"use client";
// app/admin/tickets/page.tsx
// AdminContext has no loadTickets method — tickets are fetched directly
// from GET /api/admin/tickets (admin-protected route).
// TODO: add loadTickets to AdminContext if ticket management grows.

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AdminTicketsHeader } from "@/components/sections/admin/tickets/ATHeader";
import { AdminTicketsStats } from "@/components/sections/admin/tickets/ATStats";
import { AdminTicketsToolbar } from "@/components/sections/admin/tickets/ATToolbar";
import { AdminTicketsTable } from "@/components/sections/admin/tickets/ATTable";
import { AdminTicketsPagination } from "@/components/sections/admin/tickets/ATPagination";
import { AdminTicketsEmptyState } from "@/components/sections/admin/tickets/ATEmptyState";
import { TicketScannerModal } from "@/components/sections/admin/tickets/modal/TicketScannerModal";
import { LuLoader } from "react-icons/lu";

// Shape returned by GET /api/admin/tickets
export interface AdminTicket {
  id: string;
  inviteCode: string;
  status: string; // "upcoming" | "used" | "cancelled" | "expired"
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  checkedInAt: string | null;
  createdAt: string;
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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
  }, [token, currentPage, search, status]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleMutation = () => fetchTickets();

  const handleExport = () => {
    // TODO: GET /api/admin/tickets?export=true → download CSV
    console.warn("TODO: export tickets CSV");
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full md:mt-20 mt-10">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="max-w-[1600px] w-full md:mt-20 mt-10 p-5 mx-auto space-y-8"
    >
      <AdminTicketsHeader
        activeTickets={stats?.active ?? 0}
        onScanClick={() => setIsScannerOpen(true)}
        onExportClick={handleExport}
      />

      <AdminTicketsStats stats={stats} />

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
