"use client";
import React, { useCallback, useOptimistic, useTransition } from "react";
import { motion } from "framer-motion";
import {
  LuMegaphone,
  LuInfo,
  LuSparkles,
  LuArrowRight,
  LuCalendar,
  LuClock,
  LuZap,
  LuWrench,
  LuTrophy,
  LuCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { HomeAnnouncement } from "@/lib/homeData";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ReactNode;
    color: string;
    lightColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  Update: {
    icon: <LuMegaphone className="w-5 h-5" />,
    color: "bg-blue-600",
    lightColor: "bg-blue-50",
    borderColor: "border-blue-100",
    textColor: "text-blue-600",
  },
  New: {
    icon: <LuSparkles className="w-5 h-5" />,
    color: "bg-orange-600",
    lightColor: "bg-orange-50",
    borderColor: "border-orange-100",
    textColor: "text-orange-600",
  },
  Alert: {
    icon: <LuInfo className="w-5 h-5" />,
    color: "bg-foreground",
    lightColor: "bg-muted",
    borderColor: "border-border",
    textColor: "text-foreground",
  },
  Event: {
    icon: <LuCalendar className="w-5 h-5" />,
    color: "bg-violet-600",
    lightColor: "bg-violet-50",
    borderColor: "border-violet-100",
    textColor: "text-violet-600",
  },
  Deadline: {
    icon: <LuClock className="w-5 h-5" />,
    color: "bg-red-600",
    lightColor: "bg-red-50",
    borderColor: "border-red-100",
    textColor: "text-red-600",
  },
  Achievement: {
    icon: <LuTrophy className="w-5 h-5" />,
    color: "bg-amber-600",
    lightColor: "bg-amber-50",
    borderColor: "border-amber-100",
    textColor: "text-amber-600",
  },
  Maintenance: {
    icon: <LuWrench className="w-5 h-5" />,
    color: "bg-slate-600",
    lightColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-600",
  },
};

const FALLBACK_CONFIG = TYPE_CONFIG.Alert;

// ── Props ─────────────────────────────────────────────────────────────────────

interface AnnouncementsProps {
  announcements: HomeAnnouncement[];
  unreadCount: number;
}

// ── Mark as read (client action) ──────────────────────────────────────────────

async function markAsRead(ids: string[]): Promise<void> {
  try {
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementIds: ids }),
    });
  } catch {
    // silently fail — non-critical
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Announcements = ({
  announcements,
  unreadCount: initialUnreadCount,
}: AnnouncementsProps) => {
  const [isPending, startTransition] = useTransition();

  // Optimistic read state — update UI immediately, sync in background
  const [optimisticItems, markOptimisticRead] = useOptimistic(
    announcements,
    (state, readId: string) =>
      state.map((a) => (a.id === readId ? { ...a, isRead: true } : a)),
  );

  const unreadCount = optimisticItems.filter((a) => !a.isRead).length;

  const handleMarkAllRead = useCallback(() => {
    const unreadIds = optimisticItems
      .filter((a) => !a.isRead)
      .map((a) => a.id);
    if (unreadIds.length === 0) return;

    startTransition(async () => {
      for (const id of unreadIds) {
        markOptimisticRead(id);
      }
      await markAsRead(unreadIds);
    });
  }, [optimisticItems, markOptimisticRead]);

  const handleMarkOneRead = useCallback(
    (id: string) => {
      if (optimisticItems.find((a) => a.id === id)?.isRead) return;
      startTransition(async () => {
        markOptimisticRead(id);
        await markAsRead([id]);
      });
    },
    [optimisticItems, markOptimisticRead],
  );

  // ── Empty state ─────────────────────────────────────────────────────────
  if (optimisticItems.length === 0) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center gap-3 mb-8">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">
            Community Updates
          </h3>
        </div>
        <div
          className={cn(
            "flex flex-col items-center justify-center py-16",
            "bg-background border border-dashed border-border",
            "rounded-[2.5rem] text-center gap-4",
          )}
        >
          <LuMegaphone className="w-10 h-10 text-slate-300" />
          <div>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
              No announcements yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Platform updates and community news will appear here
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">
            Community Updates
          </h3>
          {unreadCount > 0 && (
            <span
              className={cn(
                "px-2 py-0.5 bg-red-100 text-red-600",
                "text-[10px] font-bold rounded-md animate-pulse",
              )}
            >
              {unreadCount} NEW
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1.5 text-xs font-bold text-muted-foreground",
              "hover:text-primary transition-colors cursor-pointer",
              "disabled:opacity-50",
            )}
          >
            <LuCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {optimisticItems.map((item, index) => {
          const config = TYPE_CONFIG[item.type] ?? FALLBACK_CONFIG;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => handleMarkOneRead(item.id)}
              className={cn(
                "group p-6 rounded-[2rem] border bg-background flex flex-col h-full",
                "transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40",
                "cursor-pointer relative",
                config.borderColor,
                !item.isRead && "ring-1 ring-primary/20",
              )}
            >
              {/* Unread dot */}
              {!item.isRead && (
                <span
                  className={cn(
                    "absolute top-4 right-4 w-2 h-2 rounded-full bg-primary",
                    "animate-pulse",
                  )}
                />
              )}

              {/* Icon + type badge */}
              <div className="flex items-start justify-between mb-6">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    "text-background shadow-lg shadow-current/20",
                    config.color,
                  )}
                >
                  {config.icon}
                </div>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    config.lightColor,
                    config.textColor,
                  )}
                >
                  {item.type}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4
                  className={cn(
                    "text-lg font-bold text-foreground mb-2 leading-tight",
                    "group-hover:text-primary transition-colors",
                  )}
                >
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between gap-2">
                {/* Published date */}
                {item.publishedAt && (
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {new Date(item.publishedAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}

                {/* CTA or expiry hint */}
                {item.ctaHref && item.ctaLabel ? (
                  <Link
                    href={item.ctaHref}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-bold",
                      "text-foreground group-hover:text-primary transition-all",
                    )}
                  >
                    {item.ctaLabel}
                    <LuArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : item.expiresAt ? (
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                    <LuClock className="w-3 h-3" />
                    Expires{" "}
                    {new Date(item.expiresAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};