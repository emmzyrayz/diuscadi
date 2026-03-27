"use client";
// modal/AUDetailModal.tsx
// Read-only user profile viewer.
// Accepts AdminUser from AdminContext — no fake data.
// Tickets/Events tabs are honest TODOs until user-specific ticket API exists.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCircleCheck,
  LuHash,
  LuMail,
  LuGraduationCap,
  LuCalendarDays,
  LuTicket,
  LuCalendar,
  LuActivity,
  LuShieldCheck,
  LuInfo,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/context/AdminContext";
import {
  resolveAdminFullName,
  resolveAdminInitial,
} from "@/utils/adminFullName";
import { IconType } from "react-icons";
import Image from "next/image";

type TabType = "info" | "tickets" | "events" | "activity";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
  onMutation?: () => void;
}

export const AdminUserDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("info");

  const avatarSrc = user.avatar ?? null;
  const isActive = user.isAccountActive;
  const statusLabel =
    !isActive && user.membershipStatus === "banned"
      ? "Banned"
      : !isActive
        ? "Suspended"
        : "Active";
  const statusStyle =
    !isActive && user.membershipStatus === "banned"
      ? "bg-rose-50 text-rose-600 border-rose-100"
      : !isActive
        ? "bg-amber-50 text-amber-600 border-amber-100"
        : "bg-emerald-50 text-emerald-600 border-emerald-100";

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-[100]",
            "flex",
            "items-center",
            "justify-center",
            "p-4",
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn(
              "absolute",
              "inset-0",
              "bg-foreground/80",
              "backdrop-blur-sm",
            )}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative",
              "w-full",
              "max-w-5xl",
              "bg-background",
              "rounded-[3rem]",
              "shadow-2xl",
              "overflow-hidden",
              "flex",
              "flex-col",
              "max-h-[90vh]",
            )}
          >
            <button
              onClick={onClose}
              className={cn(
                "absolute",
                "top-6",
                "right-6",
                "p-3",
                "bg-muted",
                "rounded-full",
                "text-muted-foreground",
                "hover:text-foreground",
                "transition-colors",
                "z-10",
                "cursor-pointer",
              )}
            >
              <LuX className={cn("w-5", "h-5")} />
            </button>

            <div
              className={cn(
                "flex",
                "flex-col",
                "lg:flex-row",
                "h-full",
                "overflow-hidden",
              )}
            >
              {/* Left sidebar */}
              <div
                className={cn(
                  "w-full",
                  "lg:w-1/3",
                  "bg-muted",
                  "p-10",
                  "border-r",
                  "border-border",
                  "overflow-y-auto",
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex",
                    "flex-col",
                    "items-center",
                    "text-center",
                    "space-y-4",
                  )}
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "w-28",
                        "h-28",
                        "rounded-[2rem]",
                        "bg-slate-200",
                        "overflow-hidden",
                        "border-4",
                        "border-background",
                        "shadow-lg",
                        "flex",
                        "items-center",
                        "justify-center",
                        "text-4xl",
                        "font-black",
                        "text-muted-foreground",
                      )}
                    >
                      {avatarSrc ? (
                        <Image
                        height={300}
                          width={500}
                          src={avatarSrc}
                          alt={resolveAdminFullName(user.fullName)}
                          className={cn("w-full", "h-full", "object-cover")}
                        />
                      ) : (
                        <span>{resolveAdminInitial(user.fullName)}</span>
                      )}
                    </div>
                    {user.isEmailVerified && (
                      <div
                        className={cn(
                          "absolute",
                          "-bottom-2",
                          "-right-2",
                          "bg-emerald-500",
                          "text-background",
                          "p-1.5",
                          "rounded-xl",
                          "border-4",
                          "border-muted",
                          "shadow-sm",
                        )}
                      >
                        <LuCircleCheck className={cn("w-4", "h-4")} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2
                      className={cn(
                        "text-2xl",
                        "font-black",
                        "text-foreground",
                        "tracking-tight",
                      )}
                    >
                      {resolveAdminFullName(user.fullName)}
                    </h2>
                    <div
                      className={cn(
                        "flex",
                        "items-center",
                        "justify-center",
                        "gap-2",
                        "mt-2",
                      )}
                    >
                      <span
                        className={cn(
                          "px-3",
                          "py-1",
                          "bg-primary/10",
                          "text-primary",
                          "rounded-lg",
                          "text-[10px]",
                          "font-black",
                          "uppercase",
                          "tracking-widest",
                          "flex",
                          "items-center",
                          "gap-1",
                        )}
                      >
                        <LuHash className={cn("w-3", "h-3")} />{" "}
                        {user.vaultId.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={cn(
                          "px-3",
                          "py-1",
                          "rounded-full",
                          "border",
                          "text-[8px]",
                          "font-black",
                          "uppercase",
                          "tracking-widest",
                          statusStyle,
                        )}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick info */}
                <div
                  className={cn(
                    "mt-8",
                    "pt-8",
                    "border-t",
                    "border-border/60",
                    "space-y-6",
                  )}
                >
                  <InfoRow icon={LuMail} label="Email" value={user.email} />
                  <InfoRow
                    icon={LuShieldCheck}
                    label="Role"
                    value={user.role}
                  />
                  <InfoRow
                    icon={LuGraduationCap}
                    label="Edu Status"
                    value={user.eduStatus}
                  />
                  <InfoRow
                    icon={LuCalendarDays}
                    label="Member Since"
                    value={new Date(user.createdAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  />
                  {user.lastLoginAt && (
                    <InfoRow
                      icon={LuActivity}
                      label="Last Login"
                      value={new Date(user.lastLoginAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Right tabs */}
              <div
                className={cn(
                  "w-full",
                  "lg:w-2/3",
                  "flex",
                  "flex-col",
                  "bg-background",
                )}
              >
                <div
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-6",
                    "px-10",
                    "pt-10",
                    "border-b",
                    "border-border",
                    "overflow-x-auto",
                  )}
                >
                  {(
                    [
                      {
                        id: "info",
                        label: "Account Info",
                        icon: LuGraduationCap,
                      },
                      {
                        id: "tickets",
                        label: `Tickets (${user.analytics.eventsRegistered})`,
                        icon: LuTicket,
                      },
                      {
                        id: "events",
                        label: `Events (${user.analytics.eventsAttended})`,
                        icon: LuCalendar,
                      },
                      {
                        id: "activity",
                        label: "Activity Log",
                        icon: LuActivity,
                      },
                    ] as { id: TabType; label: string; icon: IconType }[]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex",
                        "items-center",
                        "gap-2",
                        "pb-4",
                        "border-b-2",
                        "transition-colors",
                        "whitespace-nowrap",
                        "cursor-pointer",
                        activeTab === tab.id
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-slate-600",
                      )}
                    >
                      <tab.icon className={cn("w-4", "h-4")} />
                      <span
                        className={cn(
                          "text-[11px]",
                          "font-black",
                          "uppercase",
                          "tracking-widest",
                        )}
                      >
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className={cn("flex-1", "overflow-y-auto", "p-10")}>
                  <AnimatePresence mode="wait">
                    {activeTab === "info" && (
                      <motion.div
                        key="info"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className={cn("space-y-8")}
                      >
                        <h3
                          className={cn(
                            "text-[11px]",
                            "font-black",
                            "uppercase",
                            "tracking-[0.2em]",
                            "text-muted-foreground",
                            "border-b",
                            "border-border",
                            "pb-4",
                          )}
                        >
                          Account Information
                        </h3>
                        <div className={cn("grid", "grid-cols-2", "gap-8")}>
                          <InfoBlock
                            icon={LuHash}
                            label="Vault ID"
                            value={user.vaultId}
                          />
                          <InfoBlock
                            icon={LuShieldCheck}
                            label="Platform Role"
                            value={user.role}
                          />
                          <InfoBlock
                            icon={LuGraduationCap}
                            label="Education"
                            value={user.eduStatus}
                          />
                          <InfoBlock
                            icon={LuTicket}
                            label="Events Registered"
                            value={String(user.analytics.eventsRegistered)}
                          />
                          <InfoBlock
                            icon={LuActivity}
                            label="Events Attended"
                            value={String(user.analytics.eventsAttended)}
                          />
                          <InfoBlock
                            icon={LuCircleCheck}
                            label="Email Verified"
                            value={user.isEmailVerified ? "Yes" : "No"}
                          />
                          {user.committee && (
                            <InfoBlock
                              icon={LuShieldCheck}
                              label="Committee"
                              value={user.committee}
                            />
                          )}
                          {user.skills?.length > 0 && (
                            <div className={cn("col-span-2", "space-y-2")}>
                              <p
                                className={cn(
                                  "text-[9px]",
                                  "font-black",
                                  "text-muted-foreground",
                                  "uppercase",
                                  "tracking-widest",
                                )}
                              >
                                Skills
                              </p>
                              <div className={cn("flex", "flex-wrap", "gap-2")}>
                                {user.skills.map((s) => (
                                  <span
                                    key={s}
                                    className={cn(
                                      "px-2",
                                      "py-1",
                                      "bg-primary/10",
                                      "text-primary",
                                      "rounded-lg",
                                      "text-[9px]",
                                      "font-black",
                                      "uppercase",
                                    )}
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "tickets" && (
                      <motion.div
                        key="tickets"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex",
                          "flex-col",
                          "items-center",
                          "justify-center",
                          "h-48",
                          "text-center",
                          "gap-3",
                        )}
                      >
                        <LuInfo
                          className={cn("w-8", "h-8", "text-slate-300")}
                        />
                        <p
                          className={cn(
                            "text-[11px]",
                            "font-black",
                            "text-muted-foreground",
                            "uppercase",
                            "tracking-widest",
                          )}
                        >
                          Ticket details coming soon
                        </p>
                        <p
                          className={cn(
                            "text-[9px]",
                            "font-bold",
                            "text-muted-foreground",
                          )}
                        >
                          {/* TODO: GET /api/admin/users/{id}/tickets */}
                          User has {user.analytics.eventsRegistered}{" "}
                          registrations total
                        </p>
                      </motion.div>
                    )}

                    {activeTab === "events" && (
                      <motion.div
                        key="events"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex",
                          "flex-col",
                          "items-center",
                          "justify-center",
                          "h-48",
                          "text-center",
                          "gap-3",
                        )}
                      >
                        <LuInfo
                          className={cn("w-8", "h-8", "text-slate-300")}
                        />
                        <p
                          className={cn(
                            "text-[11px]",
                            "font-black",
                            "text-muted-foreground",
                            "uppercase",
                            "tracking-widest",
                          )}
                        >
                          Event history coming soon
                        </p>
                        <p
                          className={cn(
                            "text-[9px]",
                            "font-bold",
                            "text-muted-foreground",
                          )}
                        >
                          {/* TODO: GET /api/admin/users/{id}/events */}
                          User attended {user.analytics.eventsAttended} events
                        </p>
                      </motion.div>
                    )}

                    {activeTab === "activity" && (
                      <motion.div
                        key="activity"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex",
                          "flex-col",
                          "items-center",
                          "justify-center",
                          "h-48",
                          "text-center",
                          "gap-3",
                        )}
                      >
                        <LuActivity
                          className={cn("w-8", "h-8", "text-slate-300")}
                        />
                        <p
                          className={cn(
                            "text-[11px]",
                            "font-black",
                            "text-muted-foreground",
                            "uppercase",
                            "tracking-widest",
                          )}
                        >
                          Activity log coming soon
                        </p>
                        {/* TODO: GET /api/admin/users/{id}/activity */}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const InfoRow: React.FC<{ icon: IconType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className={cn("flex", "items-center", "gap-4")}>
    <div
      className={cn(
        "w-10",
        "h-10",
        "rounded-xl",
        "bg-background",
        "border",
        "border-border",
        "flex",
        "items-center",
        "justify-center",
        "shrink-0",
      )}
    >
      <Icon className={cn("w-4", "h-4", "text-muted-foreground")} />
    </div>
    <div>
      <p
        className={cn(
          "text-[9px]",
          "font-black",
          "text-muted-foreground",
          "uppercase",
          "tracking-widest",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-xs",
          "font-bold",
          "text-foreground",
          "truncate",
          "max-w-[200px]",
        )}
      >
        {value || "—"}
      </p>
    </div>
  </div>
);

const InfoBlock: React.FC<{ icon: IconType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className={cn("space-y-2")}>
    <div
      className={cn("flex", "items-center", "gap-2", "text-muted-foreground")}
    >
      <Icon className={cn("w-4", "h-4")} />
      <span
        className={cn(
          "text-[9px]",
          "font-black",
          "uppercase",
          "tracking-widest",
        )}
      >
        {label}
      </span>
    </div>
    <p className={cn("text-sm", "font-bold", "text-foreground", "capitalize")}>
      {value || "—"}
    </p>
  </div>
);
