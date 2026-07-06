"use client";
// src/app/profile/referral/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// /profile/referral — the user's personal referral dashboard.
//
// Displays:
//   - Their unique invite code + QR code for sharing
//   - Stats: direct referrals, indirect referrals, total points earned
//   - Direct referrals list with their own sub-tree counts (depth-1 tree view)
//   - Recent activity feed from the PointsLog
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuGift,
  LuUsers,
  LuTrendingUp,
  LuCopy,
  LuCheck,
  LuLoader,
  LuCircleAlert,
  LuRefreshCw,
  LuChevronRight,
  LuShare2,
  LuStar,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { QRCode } from "@/components/ui/QRCode";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DirectReferral {
  userId: string;
  fullName: { firstname: string; lastname: string };
  inviteCode: string;
  joinedAt: string;
  theirDirectCount: number;
  theirIndirectCount: number;
  treeDepthReached: number;
}

interface ActivityEntry {
  id: string;
  source: string;
  amount: number;
  depth: number | null;
  refereeName: string | null;
  createdAt: string;
}

interface ReferralStats {
  directCount: number;
  indirectCount: number;
  totalEarned: number;
  treeDepthReached: number;
  lastReferralAt: string | null;
}

interface ReferralData {
  inviteCode: string;
  points: { current: number; lifetime: number };
  stats: ReferralStats;
  directReferrals: DirectReferral[];
  activityFeed: ActivityEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sourceLabel(source: string, depth: number | null): string {
  if (source === "referral_signup") {
    return depth === 1
      ? "Direct referral signup"
      : `Indirect signup (depth ${depth})`;
  }
  if (source === "referral_event_reg") {
    return depth === 1
      ? "Event referral"
      : `Indirect event referral (depth ${depth})`;
  }
  return source;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? "");

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReferralPage() {
  const { token } = useAuth();

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/referrals/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error ?? "Failed to load referral data");
      setData(json as ReferralData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load referral data",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyCode = () => {
    if (!data?.inviteCode) return;
    navigator.clipboard.writeText(data.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!data?.inviteCode) return;
    const link = `${APP_URL}/auth/signup?ref=${data.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const qrValue = data?.inviteCode
    ? `${APP_URL}/auth/signup?ref=${data.inviteCode}`
    : "";

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <LuCircleAlert className="w-10 h-10 text-rose-500" />
        <p className="text-sm font-bold text-muted-foreground text-center">
          {error ?? "Something went wrong"}
        </p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary transition-all cursor-pointer"
        >
          <LuRefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 mt-[90px] space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
          <LuGift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
            Referral Program
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Invite friends and earn Career Points
          </p>
        </div>
        <button
          onClick={fetchData}
          className="ml-auto p-2 rounded-xl text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-all cursor-pointer"
        >
          <LuRefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Invite code card ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-foreground rounded-[2.5rem] p-8 text-background relative overflow-hidden shadow-2xl shadow-foreground/20">
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1">
                  Your Referral Code
                </p>
                <p className="text-xs text-background/60 font-medium leading-relaxed">
                  Share this code or link. Anyone who signs up using it earns a
                  discount and you earn Career Points.
                </p>
              </div>

              {/* QR code */}
              <div className="flex justify-center">
                <div className="bg-background p-4 rounded-[1.5rem] shadow-xl">
                  <QRCode
                    value={qrValue}
                    size={160}
                    cornerSquareStyle="extra-rounded"
                    withLogo
                  />
                </div>
              </div>

              {/* Code + copy */}
              <div className="bg-background/10 rounded-2xl p-4 flex items-center justify-between border border-background/10">
                <span className="font-mono text-lg font-black tracking-[0.3em] text-primary uppercase">
                  {data.inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 hover:bg-background/10 rounded-xl transition-all cursor-pointer"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <LuCheck className="w-5 h-5 text-emerald-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <LuCopy className="w-5 h-5 text-background/70" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              {/* Copy link button */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-3 bg-background/10 hover:bg-background/20 border border-background/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-background transition-all cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <LuCheck className="w-4 h-4 text-emerald-400" /> Link
                    Copied!
                  </>
                ) : (
                  <>
                    <LuShare2 className="w-4 h-4" /> Copy Invite Link
                  </>
                )}
              </button>
            </div>

            {/* Background glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[60px] -ml-16 -mb-16" />
          </div>
        </div>

        {/* ── Right: Stats + tree + feed ── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={LuUsers}
              label="Direct"
              value={data.stats.directCount}
              color="text-emerald-500"
              bg="bg-emerald-50 border-emerald-100"
            />
            <StatCard
              icon={LuTrendingUp}
              label="Indirect"
              value={data.stats.indirectCount}
              color="text-blue-500"
              bg="bg-blue-50 border-blue-100"
            />
            <StatCard
              icon={LuStar}
              label="Pts Earned"
              value={data.stats.totalEarned}
              color="text-amber-500"
              bg="bg-amber-50 border-amber-100"
            />
          </div>

          {/* Direct referrals list */}
          <div className="bg-background border-2 border-border rounded-[2rem] overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">
                Direct Referrals
              </h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                People who signed up using your code
              </p>
            </div>

            {data.directReferrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                <LuUsers className="w-8 h-8 text-muted-foreground/20" />
                <div>
                  <p className="text-sm font-bold text-muted-foreground/50">
                    No referrals yet
                  </p>
                  <p className="text-[11px] text-muted-foreground/35 mt-0.5">
                    Share your code to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.directReferrals.map((ref) => (
                  <div
                    key={ref.userId}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-xs font-black text-muted-foreground shrink-0">
                        {ref.fullName.firstname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-foreground">
                          {ref.fullName.firstname} {ref.fullName.lastname}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                          Joined {formatRelative(ref.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Their sub-tree counts */}
                      {(ref.theirDirectCount > 0 ||
                        ref.theirIndirectCount > 0) && (
                        <div className="text-right">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                            +{ref.theirDirectCount} direct
                          </p>
                          {ref.theirIndirectCount > 0 && (
                            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                              +{ref.theirIndirectCount} indirect
                            </p>
                          )}
                        </div>
                      )}
                      <LuChevronRight className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity feed */}
          {data.activityFeed.length > 0 && (
            <div className="bg-background border-2 border-border rounded-[2rem] overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">
                  Recent Activity
                </h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  Points earned from referrals
                </p>
              </div>
              <div className="divide-y divide-border">
                {data.activityFeed.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div>
                      <p className="text-[11px] font-bold text-foreground">
                        {sourceLabel(entry.source, entry.depth)}
                        {entry.refereeName && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {entry.refereeName}
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {formatRelative(entry.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-black text-emerald-500 shrink-0">
                      +{entry.amount} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bg: string;
}> = ({ icon: Icon, label, value, color, bg }) => (
  <div className={cn("rounded-[1.5rem]", "border", "p-4", "space-y-2", bg)}>
    <Icon className={cn("w-5 h-5", color)} />
    <p className="text-2xl font-black text-foreground">{value}</p>
    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
      {label}
    </p>
  </div>
);
