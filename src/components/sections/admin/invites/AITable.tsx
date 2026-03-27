"use client";
// sections/admin/invites/AITable.tsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuCopy,
  LuCircleCheck,
  LuEllipsis,
  LuEye,
  LuBan,
  LuCalendar,
  LuHash,
  LuUsers,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { AdminInviteDetailsModal } from "./modal/AIDetailModal";
import type { AdminInvite } from "@/app/admin/invites/page";

interface Props {
  invites: AdminInvite[];
  onRevoke: (id: string) => void;
  onMutation: () => void;
}

export const AdminInvitesTable: React.FC<Props> = ({
  invites,
  onRevoke,
  onMutation,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={cn(
      "w-full",
      "bg-background",
      "px-4",
      "py-2",
      "border-2",
      "border-border",
      "rounded-[2.5rem]",
      "shadow-sm",
    )}
  >
    <div className="w-full">
      <table
        className={cn(
          "w-full",
          "text-left",
          "border-collapse",
          "min-w-[360px]",
        )}
      >
        <thead>
          <tr className={cn("bg-muted/50", "border-b", "border-border")}>
            <th
              className={cn(
                "px-3",
                "md:px-4",
                "lg:px-6",
                "py-3",
                "lg:py-5",
                "text-[8px]",
                "md:text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.1em]",
                "lg:tracking-[0.2em]",
              )}
            >
              Code
            </th>
            <th
              className={cn(
                "hidden",
                "md:table-cell",
                "px-4",
                "lg:px-6",
                "py-3",
                "lg:py-5",
                "text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.15em]",
                "lg:tracking-[0.2em]",
              )}
            >
              Note
            </th>
            <th
              className={cn(
                "hidden",
                "lg:table-cell",
                "px-4",
                "lg:px-6",
                "py-3",
                "lg:py-5",
                "text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.15em]",
                "lg:tracking-[0.2em]",
              )}
            >
              Usage
            </th>
            <th
              className={cn(
                "hidden",
                "lg:table-cell",
                "px-4",
                "lg:px-6",
                "py-3",
                "lg:py-5",
                "text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.15em]",
                "lg:tracking-[0.2em]",
              )}
            >
              Expires
            </th>
            <th
              className={cn(
                "px-2",
                "md:px-4",
                "lg:px-6",
                "py-3",
                "lg:py-5",
                "text-[8px]",
                "md:text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.1em]",
                "lg:tracking-[0.2em]",
              )}
            >
              Status
            </th>
            <th
              className={cn(
                "pr-3",
                "md:pr-5",
                "lg:pr-8",
                "pl-2",
                "py-3",
                "lg:py-5",
                "text-[8px]",
                "md:text-[9px]",
                "lg:text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.1em]",
                "text-right",
              )}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className={cn("divide-y", "divide-slate-50")}>
          {invites.map((invite, index) => (
            <AdminInviteRow
              key={invite.id}
              invite={invite}
              onRevoke={onRevoke}
              delay={0.1 + index * 0.03}
            />
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

const AdminInviteRow: React.FC<{
  invite: AdminInvite;
  onRevoke: (id: string) => void;
  delay?: number;
}> = ({ invite, onRevoke, delay = 0 }) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isActive = invite.status === "active";
  const isExpired = invite.status === "expired";
  const isRevoked = invite.status === "revoked";
  const isUsed = invite.status === "used";

  const copyCode = () => {
    navigator.clipboard.writeText(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usagePct =
    invite.maxUses > 0
      ? Math.round((invite.useCount / invite.maxUses) * 100)
      : 0;

  const STATUS_STYLES: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    used: "bg-slate-100 text-muted-foreground border-slate-200",
    expired: "bg-amber-50 text-amber-600 border-amber-100",
    revoked: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const DOT_STYLES: Record<string, string> = {
    active: "bg-emerald-500",
    used: "bg-slate-400",
    expired: "bg-amber-500",
    revoked: "bg-rose-500",
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay }}
        className={cn(
          "group transition-all hover:bg-muted/50",
          (isExpired || isRevoked) && "opacity-60",
        )}
      >
        {/* Code */}
        <td
          className={cn(
            "px-3",
            "md:px-4",
            "lg:px-6",
            "py-2.5",
            "md:py-3",
            "lg:py-5",
          )}
        >
          <div className={cn("flex", "items-center", "gap-2", "md:gap-3")}>
            <div
              className={cn(
                "p-1.5",
                "md:p-2",
                "rounded-lg",
                "md:rounded-xl",
                "bg-muted",
                "flex",
                "items-center",
                "justify-center",
                "shrink-0",
              )}
            >
              <LuHash
                className={cn(
                  "w-3",
                  "h-3",
                  "md:w-3.5",
                  "md:h-3.5",
                  "text-muted-foreground",
                )}
              />
            </div>
            <div className={cn("flex", "flex-col", "min-w-0")}>
              <span
                className={cn(
                  "text-xs",
                  "md:text-sm",
                  "font-black",
                  "text-foreground",
                  "font-mono",
                  "tracking-widest",
                  "uppercase",
                  "group-hover:text-primary",
                  "transition-colors",
                )}
              >
                {invite.code}
              </span>
              <span
                className={cn(
                  "text-[8px]",
                  "md:text-[9px]",
                  "font-medium",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                  "mt-0.5",
                )}
              >
                {new Date(invite.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <button
              onClick={copyCode}
              className={cn(
                "p-1",
                "md:p-1.5",
                "hover:bg-slate-200",
                "rounded-md",
                "text-muted-foreground",
                "hover:text-foreground",
                "transition-colors",
                "shrink-0",
              )}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="c"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <LuCircleCheck
                      className={cn(
                        "w-3",
                        "h-3",
                        "md:w-3.5",
                        "md:h-3.5",
                        "text-emerald-500",
                      )}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="u"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <LuCopy
                      className={cn("w-3", "h-3", "md:w-3.5", "md:h-3.5")}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </td>

        {/* Note — md+ */}
        <td
          className={cn(
            "hidden",
            "md:table-cell",
            "px-4",
            "lg:px-6",
            "py-3",
            "lg:py-5",
          )}
        >
          <span
            className={cn(
              "text-[11px]",
              "font-medium",
              "text-muted-foreground",
              "line-clamp-1",
              "max-w-[200px]",
            )}
          >
            {invite.note ?? <span className={cn('italic', 'opacity-50')}>No note</span>}
          </span>
        </td>

        {/* Usage — lg+ */}
        <td
          className={cn(
            "hidden",
            "lg:table-cell",
            "px-4",
            "lg:px-6",
            "py-3",
            "lg:py-5",
          )}
        >
          <div className={cn("flex", "flex-col", "gap-1.5", "w-28")}>
            <div className={cn("flex", "justify-between", "items-center")}>
              <div className={cn("flex", "items-center", "gap-1.5")}>
                <LuUsers
                  className={cn("w-3", "h-3", "text-muted-foreground")}
                />
                <span
                  className={cn("text-[10px]", "font-black", "text-foreground")}
                >
                  {invite.useCount} / {invite.maxUses}
                </span>
              </div>
              <span
                className={cn(
                  "text-[8px]",
                  "font-black",
                  "uppercase",
                  usagePct >= 100 ? "text-rose-500" : "text-emerald-500",
                )}
              >
                {usagePct >= 100 ? "Full" : `${usagePct}%`}
              </span>
            </div>
            <div
              className={cn(
                "w-full",
                "h-1.5",
                "bg-muted",
                "rounded-full",
                "overflow-hidden",
              )}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(usagePct, 100)}%` }}
                transition={{ duration: 1, delay }}
                className={cn(
                  "h-full",
                  "rounded-full",
                  usagePct >= 100 ? "bg-rose-500" : "bg-primary",
                )}
              />
            </div>
          </div>
        </td>

        {/* Expires — lg+ */}
        <td
          className={cn(
            "hidden",
            "lg:table-cell",
            "px-4",
            "lg:px-6",
            "py-3",
            "lg:py-5",
          )}
        >
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-1.5",
              "text-muted-foreground",
            )}
          >
            <LuCalendar className={cn("w-3", "h-3")} />
            <span
              className={cn(
                "text-[10px]",
                "font-bold",
                "uppercase",
                "tracking-widest",
              )}
            >
              {invite.expiresAt
                ? new Date(invite.expiresAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Never"}
            </span>
          </div>
        </td>

        {/* Status */}
        <td
          className={cn(
            "px-2",
            "md:px-4",
            "lg:px-6",
            "py-2.5",
            "md:py-3",
            "lg:py-5",
          )}
        >
          <span
            className={cn(
              "rounded-full border font-black uppercase inline-flex items-center",
              "px-1.5 py-0.5 text-[7px] tracking-[0.1em] gap-1",
              "md:px-3 md:py-1.5 md:text-[9px] md:tracking-widest md:gap-2",
              STATUS_STYLES[invite.status] ??
                "bg-muted text-muted-foreground border-slate-200",
            )}
          >
            <div
              className={cn(
                "rounded-full shrink-0",
                "w-1 h-1 md:w-1.5 md:h-1.5",
                DOT_STYLES[invite.status] ?? "bg-slate-300",
              )}
            />
            {invite.status}
          </span>
        </td>

        {/* Actions */}
        <td
          className={cn(
            "pr-2",
            "md:pr-5",
            "lg:pr-8",
            "pl-1",
            "md:pl-2",
            "py-2.5",
            "md:py-3",
            "lg:py-5",
            "text-right",
            "relative",
          )}
        >
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "p-1.5",
              "md:p-2",
              "hover:bg-background",
              "border",
              "border-transparent",
              "hover:border-border",
              "rounded-lg",
              "text-muted-foreground",
              "hover:text-foreground",
              "transition-all",
              "cursor-pointer",
            )}
          >
            <LuEllipsis className={cn("w-4", "h-4", "md:w-5", "md:h-5")} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn('fixed', 'inset-0', 'z-10')}
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={cn(
                    "absolute",
                    "right-1",
                    "md:right-5",
                    "lg:right-8",
                    "top-10",
                    "md:top-12",
                    "w-44",
                    "md:w-48",
                    "bg-background",
                    "border",
                    "border-border",
                    "rounded-2xl",
                    "shadow-2xl",
                    "z-20",
                    "p-1.5",
                    "md:p-2",
                  )}
                >
                  <MenuItem
                    icon={LuEye}
                    label="View Details"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDetails(true);
                    }}
                  />
                  <MenuItem
                    icon={LuCopy}
                    label="Copy Code"
                    onClick={() => {
                      setShowMenu(false);
                      copyCode();
                    }}
                  />
                  {isActive && (
                    <>
                      <div className={cn('h-px', 'bg-muted', 'my-1')} />
                      <MenuItem
                        icon={LuBan}
                        label="Revoke"
                        onClick={() => {
                          setShowMenu(false);
                          onRevoke(invite.id);
                        }}
                        color="text-rose-600"
                      />
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </td>
      </motion.tr>

      <Portal>
        <AdminInviteDetailsModal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          invite={invite}
        />
      </Portal>
    </>
  );
};

const MenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  color?: string;
  onClick: () => void;
}> = ({ icon: Icon, label, color = "text-slate-600", onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2.5 px-2.5 md:px-3 py-2 md:py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer",
      color,
    )}
  >
    <Icon className={cn("w-3.5", "h-3.5", "md:w-4", "md:h-4")} />
    <span
      className={cn(
        "text-[9px]",
        "md:text-[10px]",
        "font-black",
        "uppercase",
        "tracking-tight",
      )}
    >
      {label}
    </span>
  </button>
);
