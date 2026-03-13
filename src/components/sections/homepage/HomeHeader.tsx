"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Settings,
  ChevronDown,
  Award,
  Zap,
  // X,
  CheckCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// --- Types & Interfaces ---
export interface User {
  name: string;
  avatar: string;
  status: string;
  skill: string;
  interest: string;
  projectsParticipated: string;
  points: number;
}

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}

interface HomeHeaderProps {
  user: User;
}

export const HomeHeader = ({ user }: HomeHeaderProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Workshop",
      desc: "Advanced React patterns is now live.",
      time: "2m ago",
      isNew: true,
    },
    {
      id: 2,
      title: "Project Approved",
      desc: "Your submission for 'Design Sprint' was accepted.",
      time: "1h ago",
      isNew: true,
    },
    {
      id: 3,
      title: "System Update",
      desc: "Maintenance scheduled for tonight at 12 AM.",
      time: "5h ago",
      isNew: false,
    },
  ]);

  const hasUnread = notifications.some((n) => n.isNew);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isNew: false })));
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // ── Search loading simulation ─────────────────────────────────────────────
  // useMemo derives isSearching synchronously from searchQuery —
  // no useEffect + setState needed, which avoids cascading renders.
  // For real search, replace this with a debounced fetch.
  const isSearching = useMemo(() => searchQuery.length > 0, [searchQuery]);

  return (
    <header
      className={cn(
        "w-full",
        "bg-background",
        "border-b",
        "border-border",
        "sticky",
        "top-0",
        "z-50",
      )}
    >
      <div
        className={cn(
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-3",
        )}
      >
        <div className={cn("flex", "items-center", "justify-between", "gap-4")}>
          {/* LEFT: Greeting & Profile */}
          <div className={cn("flex", "items-center", "gap-3", "min-w-0")}>
            <Link
              href="/profile"
              className={cn(
                "relative",
                "shrink-0",
                "group",
                "transition-transform",
                "hover:scale-105",
              )}
            >
              <div
                className={cn(
                  "w-10",
                  "h-10",
                  "md:w-12",
                  "md:h-12",
                  "rounded-xl",
                  "overflow-hidden",
                  "border",
                  "border-border",
                  "text-muted",
                  "flex",
                  "items-center",
                  "justify-center",
                )}
              >
                {user.avatar ? (
                  <Image
                    width={48}
                    height={48}
                    src={user.avatar}
                    alt={user.name}
                    className={cn("object-cover", "w-full", "h-full")}
                  />
                ) : (
                  <span className={cn("text-muted-foreground", "font-bold")}>
                    {initials}
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "absolute",
                  "-bottom-0.5",
                  "-right-0.5",
                  "w-3",
                  "h-3",
                  "bg-green-500",
                  "border-2",
                  "border-background",
                  "rounded-full",
                )}
              />
            </Link>
            <div className="truncate">
              <h1
                className={cn(
                  "text-base",
                  "md:text-lg",
                  "font-bold",
                  "text-foreground",
                  "truncate",
                )}
              >
                Hi, {user.name} 👋
              </h1>
              <p
                className={cn(
                  "text-xs",
                  "text-muted-foreground",
                  "hidden",
                  "md:block",
                )}
              >
                Ready for your next step?
              </p>
            </div>
          </div>

          {/* MIDDLE: Search Bar */}
          <div
            className={cn(
              "hidden",
              "sm:flex",
              "flex-1",
              "max-w-md",
              "mx-4",
              "relative",
            )}
          >
            <div
              className={cn(
                "flex",
                "items-center",
                "bg-muted",
                "border",
                "border-border",
                "rounded-lg",
                "px-3",
                "py-1.5",
                "w-full",
                "focus-within:ring-2",
                "focus-within:ring-primary/10",
                "transition-all",
              )}
            >
              <Search className={cn("w-4", "h-4", "text-muted-foreground")} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workshops..."
                className={cn(
                  "bg-transparent",
                  "border-none",
                  "outline-none",
                  "text-sm",
                  "ml-2",
                  "w-full",
                  "text-slate-600",
                )}
              />
            </div>

            <AnimatePresence>
              {searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "absolute",
                    "top-full",
                    "left-0",
                    "right-0",
                    "mt-2",
                    "bg-background",
                    "border",
                    "border-border",
                    "shadow-xl",
                    "rounded-xl",
                    "p-4",
                    "min-h-[100px]",
                  )}
                >
                  {isSearching ? (
                    <div className="space-y-3">
                      <div
                        className={cn(
                          "h-4",
                          "w-3/4",
                          "text-muted",
                          "rounded",
                          "animate-pulse",
                        )}
                      />
                      <div
                        className={cn(
                          "h-4",
                          "w-1/2",
                          "text-muted",
                          "rounded",
                          "animate-pulse",
                        )}
                      />
                    </div>
                  ) : (
                    <p
                      className={cn(
                        "text-sm",
                        "text-muted-foreground",
                        "text-center",
                        "py-4",
                      )}
                    >
                      No results found for &apos;{searchQuery}&apos;
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Actions */}
          <div className={cn("flex", "items-center", "gap-2", "md:gap-3")}>
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative",
                  "p-2",
                  "hover:bg-muted",
                  "rounded-lg",
                  "transition-colors",
                  "group",
                )}
              >
                <Bell
                  className={cn(
                    "w-5 h-5 text-slate-600 group-hover:text-primary",
                    showNotifications && "text-primary",
                  )}
                />
                <span
                  className={cn(
                    "absolute",
                    "top-2",
                    "right-2",
                    "w-2",
                    "h-2",
                    "bg-primary",
                    "rounded-full",
                    "border-2",
                    "border-background",
                  )}
                />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={cn(
                      "absolute",
                      "right-0",
                      "mt-3",
                      "w-80",
                      "bg-background",
                      "border",
                      "border-border",
                      "shadow-2xl",
                      "rounded-2xl",
                      "overflow-hidden",
                      "z-50",
                    )}
                  >
                    <div
                      className={cn(
                        "p-4",
                        "border-b",
                        "border-slate-50",
                        "flex",
                        "justify-between",
                        "items-center",
                        "bg-muted/50",
                      )}
                    >
                      <div>
                        <h3
                          className={cn(
                            "font-bold",
                            "text-foreground",
                            "text-sm",
                          )}
                        >
                          Notifications
                        </h3>
                        {hasUnread && (
                          <p
                            className={cn(
                              "text-[10px]",
                              "text-primary",
                              "font-medium",
                            )}
                          >
                            You have unread messages
                          </p>
                        )}
                      </div>
                      {hasUnread && (
                        <button
                          onClick={markAllAsRead}
                          className={cn(
                            "flex",
                            "items-center",
                            "gap-1",
                            "text-[10px]",
                            "font-bold",
                            "text-primary",
                            "hover:bg-primary/10",
                            "px-2",
                            "py-1",
                            "rounded-md",
                            "transition-colors",
                          )}
                        >
                          <CheckCheck className={cn("w-3", "h-3")} /> Mark all
                        </button>
                      )}
                    </div>

                    <div
                      className={cn(
                        "max-h-[300px]",
                        "overflow-y-auto",
                        "p-2",
                        "space-y-1",
                      )}
                    >
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <NotificationItem
                            key={n.id}
                            title={n.title}
                            desc={n.desc}
                            time={n.time}
                            isNew={n.isNew}
                          />
                        ))
                      ) : (
                        <div
                          className={cn(
                            "py-8",
                            "text-center",
                            "text-muted-foreground",
                            "text-xs",
                          )}
                        >
                          No notifications yet
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "flex items-center gap-1 md:gap-2 pl-2 border-l border-border ml-1 transition-all",
                  isOpen ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Settings
                  className={cn(
                    "w-5 h-5 transition-transform duration-500",
                    isOpen && "rotate-180",
                  )}
                />
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={cn(
                      "absolute",
                      "right-0",
                      "mt-3",
                      "w-72",
                      "bg-background",
                      "border",
                      "border-border",
                      "shadow-xl",
                      "rounded-2xl",
                      "overflow-hidden",
                      "p-2",
                      "z-50",
                    )}
                  >
                    {/* Points Card */}
                    <div
                      className={cn(
                        "bg-orange-50",
                        "p-4",
                        "rounded-xl",
                        "mb-2",
                        "flex",
                        "items-center",
                        "justify-between",
                      )}
                    >
                      <div className={cn("flex", "items-center", "gap-2")}>
                        <div
                          className={cn(
                            "w-8",
                            "h-8",
                            "bg-primary",
                            "rounded-full",
                            "flex",
                            "items-center",
                            "justify-center",
                            "text-background",
                            "text-xs",
                            "font-bold",
                            "shadow-lg",
                            "shadow-primary/20",
                          )}
                        >
                          P
                        </div>
                        <span
                          className={cn(
                            "text-sm",
                            "font-bold",
                            "text-orange-900",
                          )}
                        >
                          Career Points
                        </span>
                      </div>
                      <span
                        className={cn("text-lg", "font-black", "text-primary")}
                      >
                        {user.points}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "space-y-1",
                        "py-2",
                        "border-t",
                        "border-slate-50",
                      )}
                    >
                      <DropdownItem
                        icon={<Award className={cn("w-4", "h-4")} />}
                        label="Status"
                        value={user.status}
                        color="text-blue-600"
                        bg="bg-blue-50"
                      />
                      <DropdownItem
                        icon={<Zap className={cn("w-4", "h-4")} />}
                        label="Core Skill"
                        value={user.skill}
                        color="text-amber-600"
                        bg="bg-amber-50"
                      />
                    </div>

                    <div
                      className={cn(
                        "mt-2",
                        "pt-2",
                        "border-t",
                        "border-border",
                      )}
                    >
                      <button
                        onClick={() => router.push("/settings")}
                        className={cn(
                          "w-full",
                          "flex",
                          "items-center",
                          "gap-2",
                          "px-3",
                          "py-2",
                          "text-sm",
                          "text-slate-600",
                          "hover:bg-muted",
                          "rounded-lg",
                          "transition-colors",
                          "cursor-pointer",
                        )}
                      >
                        <Settings className={cn("w-4", "h-4")} /> Account
                        Settings
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// --- Sub-components ---

const NotificationItem = ({
  title,
  desc,
  time,
  isNew,
}: {
  title: string;
  desc: string;
  time: string;
  isNew?: boolean;
}) => (
  <div
    className={cn(
      "p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer mb-1",
      isNew && "bg-blue-50/50",
    )}
  >
    <div className={cn("flex", "justify-between", "items-start", "mb-1")}>
      <span className={cn("text-sm", "font-bold", "text-foreground")}>
        {title}
      </span>
      <span className={cn("text-[10px]", "text-muted-foreground")}>{time}</span>
    </div>
    <p className={cn("text-xs", "text-muted-foreground", "line-clamp-2")}>
      {desc}
    </p>
  </div>
);

const DropdownItem = ({ icon, label, value, color, bg }: DropdownItemProps) => (
  <div
    className={cn(
      "flex",
      "items-center",
      "justify-between",
      "px-3",
      "py-2",
      "rounded-lg",
      "hover:bg-muted",
      "transition-colors",
    )}
  >
    <div className={cn("flex", "items-center", "gap-3")}>
      <div className={cn("p-1.5 rounded-md", bg, color)}>{icon}</div>
      <span className={cn("text-xs", "font-medium", "text-muted-foreground")}>
        {label}
      </span>
    </div>
    <span className={cn("text-xs font-bold", color)}>{value}</span>
  </div>
);
