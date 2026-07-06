"use client";
// src/app/leaderboard/page.tsx
// /leaderboard — platform-wide points leaderboard.
// Default view: all approved members ranked by lifetime points.
// Committee filter: narrows to one committee's members.
// Caller's own rank is always shown in a sticky card at the top,
// regardless of which page they're browsing.

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LuTrophy,
  LuLoader,
  LuChevronLeft,
  LuChevronRight,
  LuCircleAlert,
  LuRefreshCw,
  LuShare2,
  LuMedal,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  lifetimePoints: number;
  currentPoints: number;
  directReferrals: number;
  committee: {
    slug: string;
    name: string;
    color: string;
    role?: string;
  } | null;
}

interface CommitteeOption {
  slug: string;
  name: string;
  color: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Rank medal config ────────────────────────────────────────────────────────

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="text-lg" title="1st place">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="text-lg" title="2nd place">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="text-lg" title="3rd place">
        🥉
      </span>
    );
  return (
    <span className={cn('text-[11px]', 'font-mono', 'font-black', 'text-muted-foreground/60', 'w-6', 'text-center')}>
      #{rank}
    </span>
  );
}

// ─── Single leaderboard row ───────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  isCallerRow,
}: {
  entry: LeaderboardEntry;
  isCallerRow: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
        isCallerRow
          ? "bg-primary/5 border-primary/20"
          : "bg-background border-border hover:border-border/80",
      )}
    >
      {/* Rank */}
      <div className={cn('w-8', 'flex', 'items-center', 'justify-center', 'shrink-0')}>
        <RankDisplay rank={entry.rank} />
      </div>

      {/* Avatar */}
      <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-muted', 'border', 'border-border', 'overflow-hidden', 'shrink-0', 'flex', 'items-center', 'justify-center', 'text-sm', 'font-black', 'text-muted-foreground')}>
        {entry.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt={entry.name}
            width={40}
            height={40}
            className={cn('w-full', 'h-full', 'object-cover')}
          />
        ) : (
          entry.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Name + committee */}
      <div className={cn('flex-1', 'min-w-0')}>
        <p
          className={cn(
            "text-sm font-black tracking-tight truncate",
            isCallerRow ? "text-primary" : "text-foreground",
          )}
        >
          {entry.name}
          {isCallerRow && (
            <span className={cn('ml-2', 'text-[9px]', 'font-black', 'text-primary', 'uppercase', 'tracking-widest')}>
              You
            </span>
          )}
        </p>
        {entry.committee && (
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'truncate', 'mt-0.5')}>
            {entry.committee.name}
            {entry.committee.role && ` · ${entry.committee.role}`}
          </p>
        )}
      </div>

      {/* Referrals */}
      <div className={cn('hidden', 'sm:flex', 'items-center', 'gap-1', 'text-[10px]', 'font-mono', 'text-muted-foreground/60', 'shrink-0')}>
        <LuShare2 className={cn('w-3', 'h-3')} />
        {entry.directReferrals}
      </div>

      {/* Points */}
      <div className={cn('text-right', 'shrink-0')}>
        <p className={cn('text-sm', 'font-black', 'text-foreground')}>
          {entry.lifetimePoints.toLocaleString()}
        </p>
        <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
          pts
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { token, isAuthenticated, sessionStatus } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [callerRank, setCallerRank] = useState<LeaderboardEntry | null>(null);
  const [committees, setCommittees] = useState<CommitteeOption[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [committeeFilter, setCommitteeFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch committees for the filter dropdown ──────────────────────────────

  useEffect(() => {
    fetch("/api/platform/committees")
      .then((r) => r.json())
      .then((d) => {
        if (d.committees) {
          setCommittees(
            d.committees.map(
              (c: { slug: string; name: string; color: string }) => ({
                slug: c.slug,
                name: c.name,
                color: c.color,
              }),
            ),
          );
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch leaderboard ──────────────────────────────────────────────────────

  const fetchLeaderboard = useCallback(
    async (committee: string, page: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (committee) params.set("committee", committee);

        const res = await fetch(
          `/api/platform/leaderboard?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error ?? "Failed to load leaderboard");

        setEntries(data.leaderboard);
        setCallerRank(data.callerRank);
        setPagination(data.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load leaderboard",
        );
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.replace("/auth?next=/leaderboard");
      return;
    }
    if (isAuthenticated) {
      fetchLeaderboard(committeeFilter, currentPage);
    }
  }, [
    isAuthenticated,
    sessionStatus,
    router,
    fetchLeaderboard,
    committeeFilter,
    currentPage,
  ]);

  const handleCommitteeChange = (slug: string) => {
    setCommitteeFilter(slug);
    setCurrentPage(1);
  };

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading && entries.length === 0) {
    return (
      <div className={cn('flex', 'items-center', 'justify-center', 'min-h-screen')}>
        <LuLoader className={cn('w-8', 'h-8', 'text-primary', 'animate-spin')} />
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'min-h-screen', 'gap-4')}>
        <LuCircleAlert className={cn('w-10', 'h-10', 'text-red-500')} />
        <p className={cn('text-sm', 'font-bold', 'text-red-500')}>{error}</p>
        <button
          onClick={() => fetchLeaderboard(committeeFilter, currentPage)}
          className={cn('flex', 'items-center', 'gap-2', 'px-6', 'py-3', 'bg-foreground', 'text-background', 'rounded-2xl', 'text-[11px]', 'font-black', 'uppercase', 'tracking-widest')}
        >
          <LuRefreshCw className={cn('w-4', 'h-4')} /> Retry
        </button>
      </div>
    );
  }

  const callerIsOnPage =
    callerRank && entries.some((e) => e.userId === callerRank.userId);

  return (
    <div className={cn('max-w-[95vw] w-full', 'mx-auto', 'px-4', 'pt-[90px]', 'pb-16', 'space-y-8')}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className={cn('flex', 'items-center', 'gap-4')}>
        <div className={cn('w-12', 'h-12', 'rounded-2xl', 'bg-amber-500', 'flex', 'items-center', 'justify-center', 'shadow-lg', 'shadow-amber-500/20')}>
          <LuTrophy className={cn('w-6', 'h-6', 'text-background')} />
        </div>
        <div>
          <h1 className={cn('text-3xl', 'font-black', 'text-foreground', 'tracking-tighter', 'uppercase')}>
            Leaderboard
          </h1>
          <p className={cn('text-xs', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
            {committeeFilter
              ? `${committees.find((c) => c.slug === committeeFilter)?.name ?? committeeFilter} · ranked by career score`
              : "Platform-wide · ranked by career score"}
          </p>
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className={cn('flex', 'items-center', 'gap-3', 'flex-wrap')}>
        {/* Committee filter */}
        <select
          value={committeeFilter}
          onChange={(e) => handleCommitteeChange(e.target.value)}
          className={cn(
            "text-[11px] font-mono font-bold uppercase tracking-wider",
            "bg-background border border-border rounded-xl px-3 py-2",
            "outline-none focus:border-primary transition-all cursor-pointer",
          )}
        >
          <option value="">All Committees</option>
          {committees.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Refresh */}
        <button
          onClick={() => fetchLeaderboard(committeeFilter, currentPage)}
          disabled={loading}
          className={cn(
            "p-2 rounded-xl border border-border text-muted-foreground hover:bg-foreground/5 transition-all",
            loading && "animate-spin pointer-events-none",
          )}
        >
          <LuRefreshCw className={cn('w-3.5', 'h-3.5')} />
        </button>

        {pagination && (
          <p className={cn('text-[10px]', 'font-mono', 'text-muted-foreground/50', 'ml-auto')}>
            {pagination.total.toLocaleString()} members
          </p>
        )}
      </div>

      {/* ── Caller's own rank card (sticky context, shown when off-page) ─── */}
      {callerRank && !callerIsOnPage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'flex', 'items-center', 'gap-1.5')}>
            <LuMedal className={cn('w-3', 'h-3', 'text-primary')} />
            Your current rank
          </p>
          <LeaderboardRow entry={callerRank} isCallerRow={true} />
        </motion.div>
      )}

      {/* ── Ranked list ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className={cn('h-[72px]', 'bg-foreground/5', 'rounded-2xl', 'animate-pulse')}
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-20', 'gap-3', 'text-center', 'border', 'border-dashed', 'border-border', 'rounded-3xl')}>
          <LuTrophy className={cn('w-8', 'h-8', 'text-muted-foreground/20')} />
          <p className={cn('text-sm', 'font-bold', 'text-muted-foreground/50')}>
            No members ranked yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <LeaderboardRow
                entry={entry}
                isCallerRow={entry.userId === callerRank?.userId}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className={cn('flex', 'items-center', 'justify-between', 'pt-3', 'border-t', 'border-border')}>
          <span className={cn('text-[10px]', 'font-mono', 'text-muted-foreground/40')}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className={cn('flex', 'items-center', 'gap-1')}>
            <button
              disabled={!pagination.hasPrev || loading}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={cn('w-8', 'h-8', 'flex', 'items-center', 'justify-center', 'rounded-lg', 'border', 'border-border', 'disabled:opacity-30', 'hover:bg-foreground/5', 'transition-all')}
            >
              <LuChevronLeft className={cn('w-4', 'h-4')} />
            </button>
            <button
              disabled={!pagination.hasNext || loading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={cn('w-8', 'h-8', 'flex', 'items-center', 'justify-center', 'rounded-lg', 'border', 'border-border', 'disabled:opacity-30', 'hover:bg-foreground/5', 'transition-all')}
            >
              <LuChevronRight className={cn('w-4', 'h-4')} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
