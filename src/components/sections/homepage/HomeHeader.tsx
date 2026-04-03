"use client";
// components/sections/home/HomeHeader.tsx
// Search: searches through the authenticated event feed (already filtered by
//   user's eduStatus + skills). Groups results into Upcoming / Happening Now /
//   Past buckets shown inline in the dropdown.
// Notifications: UI fully built, wired to empty state. Drop in real data
//   from /api/notifications when that system is ready — just replace the
//   `notifications` array.

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Settings,
  ChevronDown,
  Award,
  Zap,
  CheckCheck,
  X,
  Calendar,
  Clock,
  History,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents } from "@/context/EventContext";
import { useUser } from "@/context/UserContext";
import type { EventSummary } from "@/context/EventContext";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface User {
  name: string;
  avatar: string;
  status: string;
  skill: string;
  interest: string;
  projectsParticipated: string;
  points: number;
}

interface HomeHeaderProps {
  user: User;
}

// ── Event time bucket ──────────────────────────────────────────────────────────

function getEventBucket(
  eventDate: string,
  endDate: string | null,
): "now" | "upcoming" | "past" {
  const now = new Date();
  const start = new Date(eventDate);
  const end = endDate
    ? new Date(endDate)
    : new Date(start.getTime() + 4 * 60 * 60 * 1000); // +4h default

  if (now >= start && now <= end) return "now";
  if (start > now) return "upcoming";
  return "past";
}

const BUCKET_CONFIG = {
  now: {
    label: "Happening Now",
    color: "text-emerald-600",
    dot: "bg-emerald-500",
    icon: Clock,
  },
  upcoming: {
    label: "Upcoming",
    color: "text-blue-600",
    dot: "bg-blue-500",
    icon: Calendar,
  },
  past: {
    label: "Past",
    color: "text-slate-400",
    dot: "bg-slate-300",
    icon: History,
  },
};

// ── Search result card ─────────────────────────────────────────────────────────

function SearchResultCard({
  event,
  onClose,
}: {
  event: EventSummary;
  onClose: () => void;
}) {
  const bucket = getEventBucket(event.eventDate, event.endDate);
  const cfg = BUCKET_CONFIG[bucket];
  const Icon = cfg.icon;

  return (
    <Link
      href={`/events/${event.slug}`}
      onClick={onClose}
      className={cn('flex', 'items-center', 'gap-3', 'px-4', 'py-3', 'hover:bg-muted/60', 'transition-colors', 'rounded-xl', 'group')}
    >
      {/* Event image */}
      <div className={cn('w-10', 'h-10', 'rounded-xl', 'overflow-hidden', 'bg-muted', 'shrink-0', 'border', 'border-border')}>
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            width={40}
            height={40}
            className={cn('object-cover', 'w-full', 'h-full')}
          />
        ) : (
          <div className={cn('w-full', 'h-full', 'flex', 'items-center', 'justify-center', 'text-muted-foreground', 'text-[9px]', 'font-black')}>
            {event.category.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn('flex-1', 'min-w-0')}>
        <p className={cn('text-[12px]', 'font-black', 'text-foreground', 'truncate', 'group-hover:text-primary', 'transition-colors')}>
          {event.title}
        </p>
        <div className={cn('flex', 'items-center', 'gap-2', 'mt-0.5')}>
          <span
            className={cn(
              "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest",
              cfg.color,
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                cfg.dot,
                bucket === "now" && "animate-pulse",
              )}
            />
            {cfg.label}
          </span>
          <span className={cn('text-[9px]', 'text-muted-foreground')}>·</span>
          <span className={cn('text-[9px]', 'text-muted-foreground', 'font-bold', 'uppercase', 'tracking-widest')}>
            {event.category}
          </span>
        </div>
      </div>

      {/* Date */}
      <span className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'shrink-0')}>
        {new Date(event.eventDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    </Link>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export const HomeHeader = ({ user }: HomeHeaderProps) => {
  const router = useRouter();
  const { feed, feedLoading, loadFeed } = useEvents();
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [showNotifications, setShowNotif] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load feed on mount so search has data
  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Search logic ────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return feed
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.overview.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 8); // cap at 8 results
  }, [searchQuery, feed]);

  // Group by bucket
  const grouped = useMemo(() => {
    const groups: Record<"now" | "upcoming" | "past", EventSummary[]> = {
      now: [],
      upcoming: [],
      past: [],
    };
    searchResults.forEach((e) => {
      const b = getEventBucket(e.eventDate, e.endDate);
      groups[b].push(e);
    });
    return groups;
  }, [searchResults]);

  const showDropdown = searchFocused && searchQuery.length > 0;

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    inputRef.current?.focus();
  }, []);

  // ── Notifications ────────────────────────────────────────────────────────────
  // TODO: replace with real data from GET /api/notifications when built.
  const notifications: {
    id: number;
    title: string;
    desc: string;
    time: string;
    isNew: boolean;
  }[] = [];
  const hasUnread = notifications.some((n) => n.isNew);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className={cn('w-full', 'bg-background', 'border-b', 'border-border', 'sticky', 'top-0', 'z-50')}>
      <div className={cn('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-3')}>
        <div className={cn('flex', 'items-center', 'justify-between', 'gap-4')}>
          {/* ── LEFT: Greeting ── */}
          <div className={cn('flex', 'items-center', 'gap-3', 'min-w-0')}>
            <Link
              href="/profile"
              className={cn('relative', 'shrink-0', 'group', 'transition-transform', 'hover:scale-105')}
            >
              <div className={cn('w-10', 'h-10', 'md:w-12', 'md:h-12', 'rounded-xl', 'overflow-hidden', 'border', 'border-border', 'flex', 'items-center', 'justify-center', 'bg-muted')}>
                {user.avatar ? (
                  <Image
                    width={48}
                    height={48}
                    src={user.avatar}
                    alt={user.name}
                    className={cn('object-cover', 'w-full', 'h-full')}
                  />
                ) : (
                  <span className={cn('text-muted-foreground', 'font-bold', 'text-sm')}>
                    {initials}
                  </span>
                )}
              </div>
              <div className={cn('absolute', '-bottom-0.5', '-right-0.5', 'w-3', 'h-3', 'bg-emerald-500', 'border-2', 'border-background', 'rounded-full')} />
            </Link>
            <div className="truncate">
              <h1 className={cn('text-base', 'md:text-lg', 'font-bold', 'text-foreground', 'truncate')}>
                Hi, {user.name} 👋
              </h1>
              <p className={cn('text-xs', 'text-muted-foreground', 'hidden', 'md:block')}>
                Ready for your next step?
              </p>
            </div>
          </div>

          {/* ── MIDDLE: Search ── */}
          <div
            ref={searchRef}
            className={cn('hidden', 'sm:flex', 'flex-1', 'max-w-md', 'mx-4', 'relative')}
          >
            <div
              className={cn(
                "flex items-center bg-muted border rounded-lg px-3 py-1.5 w-full transition-all",
                searchFocused
                  ? "border-primary/40 ring-2 ring-primary/10"
                  : "border-border",
              )}
            >
              {feedLoading ? (
                <Loader className={cn('w-4', 'h-4', 'text-muted-foreground', 'animate-spin', 'shrink-0')} />
              ) : (
                <Search className={cn('w-4', 'h-4', 'text-muted-foreground', 'shrink-0')} />
              )}
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search your events…"
                className={cn('bg-transparent', 'border-none', 'outline-none', 'text-sm', 'ml-2', 'w-full', 'text-foreground', 'placeholder:text-muted-foreground')}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className={cn('ml-1', 'text-muted-foreground', 'hover:text-foreground', 'transition-colors', 'cursor-pointer')}
                >
                  <X className={cn('w-3.5', 'h-3.5')} />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={cn('absolute', 'top-full', 'left-0', 'right-0', 'mt-2', 'bg-background', 'border', 'border-border', 'shadow-2xl', 'rounded-2xl', 'overflow-hidden', 'z-50')}
                >
                  {searchResults.length === 0 ? (
                    <div className={cn('p-6', 'text-center')}>
                      <Search className={cn('w-8', 'h-8', 'text-slate-200', 'mx-auto', 'mb-2')} />
                      <p className={cn('text-[11px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                        No events matching &quot;{searchQuery}&quot;
                      </p>
                      <p className={cn('text-[9px]', 'text-muted-foreground', 'mt-1')}>
                        Try a different keyword or category
                      </p>
                    </div>
                  ) : (
                    <div className={cn('p-2', 'max-h-80', 'overflow-y-auto')}>
                      {(["now", "upcoming", "past"] as const).map((bucket) => {
                        const events = grouped[bucket];
                        if (!events.length) return null;
                        const cfg = BUCKET_CONFIG[bucket];
                        const Icon = cfg.icon;
                        return (
                          <div key={bucket} className="mb-2">
                            <div className={cn('flex', 'items-center', 'gap-2', 'px-4', 'py-1.5')}>
                              <Icon className={cn("w-3 h-3", cfg.color)} />
                              <span
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest",
                                  cfg.color,
                                )}
                              >
                                {cfg.label}
                              </span>
                              <span className={cn('text-[9px]', 'text-muted-foreground', 'font-bold', 'ml-auto')}>
                                {events.length}
                              </span>
                            </div>
                            {events.map((e) => (
                              <SearchResultCard
                                key={e.id}
                                event={e}
                                onClose={() => {
                                  setSearchFocused(false);
                                  setSearchQuery("");
                                }}
                              />
                            ))}
                          </div>
                        );
                      })}
                      {/* View all */}
                      <div className={cn('px-4', 'py-2', 'border-t', 'border-border', 'mt-1')}>
                        <Link
                          href={`/events?q=${encodeURIComponent(searchQuery)}`}
                          onClick={() => {
                            setSearchFocused(false);
                            setSearchQuery("");
                          }}
                          className={cn('text-[10px]', 'font-black', 'text-primary', 'uppercase', 'tracking-widest', 'hover:underline')}
                        >
                          View all results for &quot;{searchQuery}&quot; →
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Actions ── */}
          <div className={cn('flex', 'items-center', 'gap-2', 'md:gap-3')}>
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotif(!showNotifications);
                  setSettingsOpen(false);
                }}
                className={cn(
                  "relative p-2 hover:bg-muted rounded-lg transition-colors group cursor-pointer",
                )}
              >
                <Bell
                  className={cn(
                    "w-5 h-5 text-slate-600 group-hover:text-primary transition-colors",
                    showNotifications && "text-primary",
                  )}
                />
                {hasUnread && (
                  <span className={cn('absolute', 'top-2', 'right-2', 'w-2', 'h-2', 'bg-primary', 'rounded-full', 'border-2', 'border-background')} />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn('fixed', 'inset-0', 'z-10')}
                      onClick={() => setShowNotif(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className={cn('absolute', 'right-0', 'mt-3', 'w-80', 'bg-background', 'border', 'border-border', 'shadow-2xl', 'rounded-2xl', 'overflow-hidden', 'z-20')}
                    >
                      {/* Header */}
                      <div className={cn('p-4', 'border-b', 'border-slate-50', 'flex', 'justify-between', 'items-center', 'bg-muted/50')}>
                        <div>
                          <h3 className={cn('font-bold', 'text-foreground', 'text-sm')}>
                            Notifications
                          </h3>
                          <p className={cn('text-[10px]', 'text-muted-foreground', 'font-medium')}>
                            {hasUnread
                              ? `${notifications.filter((n) => n.isNew).length} unread`
                              : "You're all caught up"}
                          </p>
                        </div>
                        {hasUnread && (
                          <button className={cn('flex', 'items-center', 'gap-1', 'text-[10px]', 'font-bold', 'text-primary', 'hover:bg-primary/10', 'px-2', 'py-1', 'rounded-md', 'transition-colors', 'cursor-pointer')}>
                            <CheckCheck className={cn('w-3', 'h-3')} /> Mark all
                          </button>
                        )}
                      </div>

                      {/* Notification list */}
                      {notifications.length > 0 ? (
                        <div className={cn('divide-y', 'divide-slate-50', 'max-h-64', 'overflow-y-auto')}>
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className={cn(
                                "px-4 py-3 hover:bg-muted/40 transition-colors",
                                n.isNew && "bg-primary/5",
                              )}
                            >
                              {n.isNew && (
                                <div className={cn('w-1.5', 'h-1.5', 'rounded-full', 'bg-primary', 'float-right', 'mt-1.5', 'ml-2')} />
                              )}
                              <p className={cn('text-[12px]', 'font-bold', 'text-foreground')}>
                                {n.title}
                              </p>
                              <p className={cn('text-[10px]', 'text-muted-foreground', 'mt-0.5')}>
                                {n.desc}
                              </p>
                              <p className={cn('text-[9px]', 'text-muted-foreground', 'mt-1', 'font-black', 'uppercase', 'tracking-widest')}>
                                {n.time}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={cn('p-8', 'text-center', 'space-y-3')}>
                          <Bell className={cn('w-10', 'h-10', 'text-slate-200', 'mx-auto')} />
                          <div>
                            <p className={cn('text-[11px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                              No notifications yet
                            </p>
                            <p className={cn('text-[9px]', 'text-muted-foreground', 'mt-1')}>
                              Activity updates will appear here
                              {/* TODO: wire to GET /api/notifications when built */}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Settings dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setSettingsOpen(!isSettingsOpen);
                  setShowNotif(false);
                }}
                className={cn(
                  "flex items-center gap-1 md:gap-2 pl-2 border-l border-border ml-1 transition-all cursor-pointer",
                  isSettingsOpen
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Settings
                  className={cn(
                    "w-5 h-5 transition-transform duration-500",
                    isSettingsOpen && "rotate-90",
                  )}
                />
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isSettingsOpen && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn('fixed', 'inset-0', 'z-10')}
                      onClick={() => setSettingsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className={cn('absolute', 'right-0', 'mt-3', 'w-72', 'bg-background', 'border', 'border-border', 'shadow-xl', 'rounded-2xl', 'overflow-hidden', 'p-2', 'z-20')}
                    >
                      {/* Points card */}
                      <div className={cn('bg-orange-50', 'p-4', 'rounded-xl', 'mb-2', 'flex', 'items-center', 'justify-between')}>
                        <div className={cn('flex', 'items-center', 'gap-2')}>
                          <div className={cn('w-8', 'h-8', 'bg-primary', 'rounded-full', 'flex', 'items-center', 'justify-center', 'text-background', 'text-xs', 'font-bold', 'shadow-lg', 'shadow-primary/20')}>
                            P
                          </div>
                          <span className={cn('text-sm', 'font-bold', 'text-orange-900')}>
                            Career Points
                          </span>
                        </div>
                        <span className={cn('text-lg', 'font-black', 'text-primary')}>
                          {user.points}
                        </span>
                      </div>

                      <div className={cn('space-y-1', 'py-2', 'border-t', 'border-slate-50')}>
                        <DropdownItem
                          icon={<Award className={cn('w-4', 'h-4')} />}
                          label="Status"
                          value={user.status}
                          color="text-blue-600"
                          bg="bg-blue-50"
                        />
                        <DropdownItem
                          icon={<Zap className={cn('w-4', 'h-4')} />}
                          label="Core Skill"
                          value={user.skill}
                          color="text-amber-600"
                          bg="bg-amber-50"
                        />
                      </div>

                      <div className={cn('mt-2', 'pt-2', 'border-t', 'border-border')}>
                        <button
                          onClick={() => {
                            setSettingsOpen(false);
                            router.push("/profile");
                          }}
                          className={cn('w-full', 'flex', 'items-center', 'gap-2', 'px-3', 'py-2', 'text-sm', 'text-slate-600', 'hover:bg-muted', 'rounded-lg', 'transition-colors', 'cursor-pointer')}
                        >
                          <Settings className={cn('w-4', 'h-4')} /> Account Settings
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}

const DropdownItem = ({ icon, label, value, color, bg }: DropdownItemProps) => (
  <div className={cn('flex', 'items-center', 'justify-between', 'px-3', 'py-2', 'rounded-lg', 'hover:bg-muted', 'transition-colors')}>
    <div className={cn('flex', 'items-center', 'gap-3')}>
      <div className={cn("p-1.5 rounded-md", bg, color)}>{icon}</div>
      <span className={cn('text-xs', 'font-medium', 'text-muted-foreground')}>{label}</span>
    </div>
    <span className={cn("text-xs font-bold", color)}>{value}</span>
  </div>
);
