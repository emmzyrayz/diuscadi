"use client";
// src/app/profile/points/page.tsx
// ─── /profile/points — user's personal points dashboard ──────────────────────
// Shows balance (current + lifetime), points breakdown by source group,
// and a flat paginated transaction history with filter chips.

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  LuCoins,
  LuTrendingUp,
  LuShare2,
  LuListCheck,
  LuShieldCheck,
  LuLoader,
  LuChevronLeft,
  LuChevronRight,
  LuArrowUpRight,
  LuArrowDownLeft,
  LuCalendar,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceGroup = "all" | "referrals" | "tasks" | "admin";

interface PointsBalance {
  current: number;
  lifetime: number;
  lastCreditedAt: string | null;
  fromReferrals: number;
}

interface HistoryEntry {
  id: string;
  source: string;
  sourceLabel: string;
  amount: number;
  lifetimeAfter: number;
  referralDepth: number | null;
  context: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface GroupCounts {
  all: number;
  referrals: number;
  tasks: number;
  admin: number;
}

interface PointsData {
  balance: PointsBalance;
  history: HistoryEntry[];
  pagination: Pagination;
  groupCounts: GroupCounts;
}

// ─── Filter chip config ───────────────────────────────────────────────────────

const FILTER_CHIPS: {
  value: SourceGroup;
  label: string;
  Icon: React.ElementType;
  color: string;
}[] = [
  { value: "all", label: "All", Icon: LuCoins, color: "text-foreground" },
  {
    value: "referrals",
    label: "Referrals",
    Icon: LuShare2,
    color: "text-emerald-500",
  },
  {
    value: "tasks",
    label: "Tasks",
    Icon: LuListCheck,
    color: "text-primary",
  },
  {
    value: "admin",
    label: "Admin",
    Icon: LuShieldCheck,
    color: "text-violet-500",
  },
];

// ─── Source colour coding ────────────────────────────────────────────────────

function sourceColor(source: string): string {
  if (source.startsWith("referral_")) return "text-emerald-500";
  if (source.startsWith("task_")) return "text-primary";
  if (source === "admin_grant") return "text-violet-500";
  if (source === "admin_deduct" || source === "redemption") return "text-red-500";
  return "text-foreground";
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePointsPage() {
  const { token, isAuthenticated, sessionStatus } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<SourceGroup>("all");
  const [page, setPage] = useState(1);

  const fetchPoints = useCallback(
    async (group: SourceGroup, p: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          group,
          page: String(p),
        });
        const res = await fetch(`/api/members/points?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load points");
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load points");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.replace("/auth?next=/profile/points");
      return;
    }
    if (isAuthenticated) fetchPoints(activeGroup, page);
  }, [isAuthenticated, sessionStatus, fetchPoints, activeGroup, page, router]);

  const handleGroupChange = (group: SourceGroup) => {
    setActiveGroup(group);
    setPage(1);
  };

  if (sessionStatus === "pending" || (loading && !data)) {
    return (
      <div className={cn('min-h-screen', 'flex', 'items-center', 'justify-center')}>
        <LuLoader className={cn('w-8', 'h-8', 'text-primary', 'animate-spin')} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={cn('min-h-screen', 'flex', 'items-center', 'justify-center', 'px-4')}>
        <div className={cn('text-center', 'space-y-4')}>
          <p className={cn('text-sm', 'font-bold', 'text-red-500')}>{error}</p>
          <button
            onClick={() => fetchPoints(activeGroup, page)}
            className={cn('px-6', 'py-2.5', 'bg-foreground', 'text-background', 'rounded-2xl', 'text-[11px]', 'font-black', 'uppercase', 'tracking-widest')}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const balance = data?.balance;
  const history = data?.history ?? [];
  const pagination = data?.pagination;
  const groupCounts = data?.groupCounts;

  return (
    <div className={cn('max-w-[95vw] w-full', 'mx-auto', 'px-4', 'pt-[90px]', 'pb-16', 'space-y-8')}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('flex', 'items-center', 'gap-3')}
      >
        <button
          onClick={() => router.push("/profile")}
          className={cn('p-2', 'rounded-xl', 'hover:bg-muted', 'transition-colors', 'text-muted-foreground', 'hover:text-foreground')}
        >
          <LuChevronLeft className={cn('w-5', 'h-5')} />
        </button>
        <div>
          <h1 className={cn('text-2xl', 'font-black', 'text-foreground', 'tracking-tight', 'uppercase')}>
            Career Points
          </h1>
          <p className={cn('text-xs', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
            Your rewards and transaction history
          </p>
        </div>
      </motion.div>

      {/* ── Balance cards ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={cn('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-4')}
      >
        {/* Current balance */}
        <div className={cn('bg-foreground', 'rounded-[2rem]', 'p-6', 'text-background', 'relative', 'overflow-hidden')}>
          <div className={cn('absolute', 'top-0', 'right-0', 'w-32', 'h-32', 'bg-primary/20', 'rounded-full', 'blur-3xl', '-mr-10', '-mt-10')} />
          <div className={cn('relative', 'z-10', 'space-y-3')}>
            <div className={cn('flex', 'items-center', 'gap-2')}>
              <LuCoins className={cn('w-4', 'h-4', 'text-primary')} />
              <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-primary')}>
                Available Balance
              </span>
            </div>
            <p className={cn('text-4xl', 'font-black', 'tracking-tight')}>
              {(balance?.current ?? 0).toLocaleString()}
              <span className={cn('text-lg', 'ml-1', 'opacity-50')}>pts</span>
            </p>
            {balance?.lastCreditedAt && (
              <p className={cn('text-[10px]', 'font-bold', 'opacity-40', 'uppercase', 'tracking-widest', 'flex', 'items-center', 'gap-1')}>
                <LuCalendar className={cn('w-3', 'h-3')} />
                Last earned {formatDate(balance.lastCreditedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Lifetime / career score */}
        <div className={cn('bg-background', 'border-2', 'border-border', 'rounded-[2rem]', 'p-6', 'space-y-3')}>
          <div className={cn('flex', 'items-center', 'gap-2')}>
            <LuTrendingUp className={cn('w-4', 'h-4', 'text-primary')} />
            <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-muted-foreground')}>
              Career Score
            </span>
          </div>
          <p className={cn('text-4xl', 'font-black', 'tracking-tight', 'text-foreground')}>
            {(balance?.lifetime ?? 0).toLocaleString()}
            <span className={cn('text-lg', 'ml-1', 'text-muted-foreground')}>pts</span>
          </p>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Lifetime total — never decreases
          </p>
        </div>
      </motion.div>

      {/* ── Source breakdown pills ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn('grid', 'grid-cols-2', 'sm:grid-cols-3', 'gap-3')}
      >
        <div className={cn('bg-muted', 'rounded-2xl', 'p-4', 'space-y-1')}>
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'flex', 'items-center', 'gap-1.5')}>
            <LuShare2 className={cn('w-3', 'h-3', 'text-emerald-500')} /> From Referrals
          </p>
          <p className={cn('text-xl', 'font-black', 'text-foreground')}>
            {(balance?.fromReferrals ?? 0).toLocaleString()}
            <span className={cn('text-xs', 'ml-1', 'text-muted-foreground')}>pts</span>
          </p>
        </div>
        <div className={cn('bg-muted', 'rounded-2xl', 'p-4', 'space-y-1')}>
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'flex', 'items-center', 'gap-1.5')}>
            <LuListCheck className={cn('w-3', 'h-3', 'text-primary')} /> Task Rewards
          </p>
          <p className={cn('text-xl', 'font-black', 'text-foreground')}>
            {((balance?.lifetime ?? 0) - (balance?.fromReferrals ?? 0)).toLocaleString()}
            <span className={cn('text-xs', 'ml-1', 'text-muted-foreground')}>pts</span>
          </p>
        </div>
        <div className={cn('bg-muted', 'rounded-2xl', 'p-4', 'space-y-1', 'sm:col-span-1', 'col-span-2')}>
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'flex', 'items-center', 'gap-1.5')}>
            <LuCoins className={cn('w-3', 'h-3', 'text-violet-500')} /> Total Transactions
          </p>
          <p className={cn('text-xl', 'font-black', 'text-foreground')}>
            {(groupCounts?.all ?? 0).toLocaleString()}
          </p>
        </div>
      </motion.div>

      {/* ── Transaction history ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className={cn('flex', 'items-center', 'justify-between')}>
          <h2 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
            Transaction History
          </h2>
          {loading && data && (
            <LuLoader className={cn('w-4', 'h-4', 'text-muted-foreground', 'animate-spin')} />
          )}
        </div>

        {/* Filter chips */}
        <div className={cn('flex', 'items-center', 'gap-2', 'flex-wrap')}>
          {FILTER_CHIPS.map(({ value, label, Icon, color }) => {
            const count = groupCounts?.[value] ?? 0;
            const isActive = activeGroup === value;
            return (
              <button
                key={value}
                onClick={() => handleGroupChange(value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all",
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                <Icon className={cn("w-3 h-3", isActive ? "text-background" : color)} />
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-black px-1.5 py-0.5 rounded-full",
                      isActive
                        ? "bg-background/20 text-background"
                        : "bg-foreground/8 text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* History list */}
        {history.length === 0 && !loading && (
          <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-16', 'gap-3', 'text-center', 'bg-muted', 'rounded-[2rem]')}>
            <LuCoins className={cn('w-10', 'h-10', 'text-muted-foreground/20')} />
            <p className={cn('text-sm', 'font-bold', 'text-muted-foreground/50')}>
              No transactions yet
            </p>
            <p className={cn('text-[11px]', 'text-muted-foreground/35')}>
              Complete tasks and refer members to earn points
            </p>
          </div>
        )}

        {history.length > 0 && (
          <div className={cn('bg-background', 'border-2', 'border-border', 'rounded-[2rem]', 'overflow-hidden', 'divide-y', 'divide-border')}>
            {history.map((entry) => {
              const isPositive = entry.amount > 0;
              const color = sourceColor(entry.source);
              return (
                <div
                  key={entry.id}
                  className={cn('flex', 'items-center', 'gap-4', 'px-5', 'py-4', 'hover:bg-muted/30', 'transition-colors')}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      isPositive ? "bg-emerald-500/10" : "bg-red-500/10",
                    )}
                  >
                    {isPositive ? (
                      <LuArrowUpRight
                        className={cn("w-4 h-4", color)}
                      />
                    ) : (
                      <LuArrowDownLeft className={cn('w-4', 'h-4', 'text-red-500')} />
                    )}
                  </div>

                  {/* Label + context */}
                  <div className={cn('flex-1', 'min-w-0')}>
                    <p className={cn('text-sm', 'font-bold', 'text-foreground', 'truncate')}>
                      {entry.sourceLabel}
                    </p>
                    {entry.context && (
                      <p className={cn('text-[11px]', 'text-muted-foreground', 'truncate', 'mt-0.5')}>
                        {entry.context}
                      </p>
                    )}
                    <p className={cn('text-[10px]', 'font-mono', 'text-muted-foreground/50', 'mt-0.5')}>
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>

                  {/* Amount + lifetime snapshot */}
                  <div className={cn('text-right', 'shrink-0')}>
                    <p
                      className={cn(
                        "text-sm font-black",
                        isPositive ? "text-emerald-500" : "text-red-500",
                      )}
                    >
                      {isPositive ? "+" : ""}
                      {entry.amount.toLocaleString()}
                      <span className={cn('text-[10px]', 'ml-0.5', 'opacity-70')}>pts</span>
                    </p>
                    <p className={cn('text-[10px]', 'font-mono', 'text-muted-foreground/40', 'mt-0.5')}>
                      {entry.lifetimeAfter.toLocaleString()} lifetime
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className={cn('flex', 'items-center', 'justify-between', 'pt-2')}>
            <span className={cn('text-[10px]', 'font-mono', 'text-muted-foreground/40')}>
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} transactions
            </span>
            <div className={cn('flex', 'items-center', 'gap-1')}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev || loading}
                className={cn('p-1.5', 'rounded-lg', 'hover:bg-muted', 'disabled:opacity-40', 'disabled:pointer-events-none', 'transition-colors')}
              >
                <LuChevronLeft className={cn('w-4', 'h-4')} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext || loading}
                className={cn('p-1.5', 'rounded-lg', 'hover:bg-muted', 'disabled:opacity-40', 'disabled:pointer-events-none', 'transition-colors')}
              >
                <LuChevronRight className={cn('w-4', 'h-4')} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}