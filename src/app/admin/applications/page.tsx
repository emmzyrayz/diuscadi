"use client";
// app/admin/applications/page.tsx

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { APHeader } from "@/components/sections/admin/applications/APHeader";
import { APStats } from "@/components/sections/admin/applications/APStats";
import { APToolbar } from "@/components/sections/admin/applications/APToolbar";
import { APTable } from "@/components/sections/admin/applications/APTable";
import { APPagination } from "@/components/sections/admin/applications/APPagination";
import { APEmptyState } from "@/components/sections/admin/applications/APEmptyState";
import { LuLoader } from "react-icons/lu";
import type { ApplicationType } from "@/context/ApplicationContext";
import { cn } from "../../../lib/utils";

// ── Shared type — imported by APTable, APDetailModal etc ──────────────────────
export interface AdminApplication {
  id: string;
  type: ApplicationType;
  status: "pending" | "approved" | "rejected";
  // type-specific payloads
  requestedCommittee?: string | null;
  requestedSkills?: string[] | null;
  requestedProgram?: string | null;
  sponsorshipDetails?: Record<string, unknown> | null;
  writingSamples?: string[] | null;
  topics?: string[] | null;
  // shared
  reason: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName:
      | { firstname: string; secondname?: string; lastname?: string }
      | string;
    email: string;
    avatar: string | null;
  } | null;
}

interface StatsData {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

export default function ApplicationsManagementPage() {
  const { token } = useAuth();

  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchApplications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        status: statusFilter,
      });
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/admin/applications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load applications");
      const data = await res.json();
      setApplications(data.applications ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, statusFilter, typeFilter]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch("/api/admin/applications?status=pending&limit=1", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/applications?status=approved&limit=1", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/applications?status=rejected&limit=1", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [p, a, r] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        rejectedRes.json(),
      ]);
      setStats({
        pending: p.pagination?.total ?? 0,
        approved: a.pagination?.total ?? 0,
        rejected: r.pagination?.total ?? 0,
        total:
          (p.pagination?.total ?? 0) +
          (a.pagination?.total ?? 0) +
          (r.pagination?.total ?? 0),
      });
    } catch {
      /* silently fail */
    }
  }, [token]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleMutation = () => {
    fetchApplications();
    fetchStats();
  };

  const handleAction = async (
    id: string,
    action: "approve" | "reject",
    reviewNote?: string,
  ) => {
    if (!token) return;
    await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, reviewNote }),
    });
    handleMutation();
  };

  if (loading && applications.length === 0) {
    return (
      <div className={cn('flex', 'items-center', 'justify-center', 'min-h-[60vh]', 'w-full', 'md:mt-20', 'mt-10')}>
        <LuLoader className={cn('w-8', 'h-8', 'text-primary', 'animate-spin')} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className={cn('max-w-[1600px]', 'w-full', 'md:mt-20', 'mt-10', 'p-5', 'mx-auto', 'space-y-8')}
    >
      <APHeader pendingCount={stats?.pending ?? 0} />
      <APStats stats={stats} />
      <APToolbar
        onStatusChange={(v) => {
          setStatusFilter(v);
          setCurrentPage(1);
        }}
        onTypeChange={(v) => {
          setTypeFilter(v);
          setCurrentPage(1);
        }}
      />
      {applications.length === 0 && !loading ? (
        <APEmptyState
          statusFilter={statusFilter}
          onClear={() => {
            setStatusFilter("pending");
            setTypeFilter("");
            setCurrentPage(1);
          }}
        />
      ) : (
        <div className="space-y-6">
          <APTable applications={applications} onAction={handleAction} />
          {pagination && pagination.totalPages > 1 && (
            <APPagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}
