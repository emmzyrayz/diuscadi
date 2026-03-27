"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuMail,
  LuCopy,
  LuCircleCheck,
  LuTicket,
  LuEllipsis,
  LuShieldAlert,
  LuBan,
  LuEye,
  LuSquarePen,
  LuTrash2,
  LuShieldCheck,
} from "react-icons/lu";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { Portal } from "@/components/ui/Portal";
import { AdminUserDeleteModal } from "./modal/AUDeleteModal";
import { AdminUserEditModal } from "./modal/AUEditModal";
import { AdminUserRestrictModal } from "./modal/AURestrictModal";
import type { AdminUser } from "@/context/AdminContext";
import {
  resolveAdminFullName,
  resolveAdminInitial,
} from "@/utils/adminFullName";

export type { AdminUser as UserRowData };

interface TableProps {
  users: AdminUser[];
  onViewDetails?: (user: AdminUser) => void;
  onMutation?: () => void;
}

export const AdminUsersTable: React.FC<TableProps> = ({
  users,
  onViewDetails,
  onMutation,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    setSelectedIds(
      selectedIds.size === users.length
        ? new Set()
        : new Set(users.map((u) => u.id)),
    );
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  return (
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
              {/* Checkbox */}
              {/* Checkbox — hidden on mobile, visible md+ */}
              <th
                className={cn(
                  "hidden",
                  "md:table-cell",
                  "pl-6",
                  "pr-3",
                  "lg:pl-8",
                  "lg:pr-4",
                  "py-4",
                  "lg:py-5",
                  "w-10",
                )}
              >
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === users.length && users.length > 0
                  }
                  onChange={toggleAll}
                  className={cn(
                    "w-4",
                    "h-4",
                    "rounded",
                    "border-slate-300",
                    "text-primary",
                    "focus:ring-primary",
                    "cursor-pointer",
                  )}
                />
              </th>

              {/* Identity — always visible */}
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
                  "md:tracking-[0.15em]",
                  "lg:tracking-[0.2em]",
                )}
              >
                Identity
              </th>

              {/* Contact — lg+ only */}
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
                Contact
              </th>

              {/* Status */}
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
                  "md:tracking-[0.15em]",
                  "lg:tracking-[0.2em]",
                )}
              >
                Status
              </th>

              {/* Activity — xl+ only */}
              <th
                className={cn(
                  "hidden",
                  "xl:table-cell",
                  "px-6",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-[0.2em]",
                )}
              >
                Activity
              </th>

              {/* Actions */}
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
            {users.map((user, index) => (
              <AdminUserRow
                key={user.id}
                user={user}
                isSelected={selectedIds.has(user.id)}
                onToggle={() => toggleOne(user.id)}
                onViewDetails={onViewDetails}
                onMutation={onMutation}
                delay={0.1 + index * 0.04}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

interface RowProps {
  user: AdminUser;
  isSelected: boolean;
  onToggle: () => void;
  onViewDetails?: (user: AdminUser) => void;
  onMutation?: () => void;
  delay?: number;
}

const AdminUserRow: React.FC<RowProps> = ({
  user,
  isSelected,
  onToggle,
  onViewDetails,
  onMutation,
  delay = 0,
}) => {
  const { token } = useAuth();
  const { changeStatus } = useAdmin();

  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestrict, setShowRestrict] = useState(false);

  const isBanned =
    user.isAccountActive === false && user.membershipStatus === "banned";
  const isSuspended =
    user.isAccountActive === false && user.membershipStatus !== "banned";

  const copyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuspend = async () => {
    if (!token) return;
    await changeStatus(user.id, false, "Suspended by admin", token);
    setShowMenu(false);
    onMutation?.();
  };

  const handleRestore = async () => {
    if (!token) return;
    await changeStatus(user.id, true, undefined, token);
    setShowMenu(false);
    onMutation?.();
  };

  const STATUS_LABEL = isBanned
    ? "Banned"
    : isSuspended
      ? "Suspended"
      : "Active";
  const STATUS_STYLE = isBanned
    ? "bg-rose-50 text-rose-600 border-rose-100"
    : isSuspended
      ? "bg-amber-50 text-amber-600 border-amber-100"
      : "bg-emerald-50 text-emerald-600 border-emerald-100";

  const avatarSrc = user.avatar ?? null;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay }}
        className={cn(
          "group transition-all",
          isSelected ? "bg-primary/5" : "hover:bg-muted/50",
          !user.isAccountActive && "opacity-75",
        )}
      >
        {/* Checkbox — md+ */}
        <td
          className={cn(
            "hidden",
            "md:table-cell",
            "pl-4",
            "lg:pl-8",
            "pr-2",
            "lg:pr-4",
            "py-3",
            "lg:py-5",
            "relative",
          )}
        >
          {!user.isAccountActive && (
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                isBanned ? "bg-rose-500" : "bg-amber-500",
              )}
            />
          )}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className={cn(
              "w-3.5",
              "h-3.5",
              "lg:w-4",
              "lg:h-4",
              "rounded",
              "border-slate-300",
              "text-primary",
              "focus:ring-primary",
              "cursor-pointer",
            )}
          />
        </td>

        {/* ── Identity ──────────────────────────────────────────────────── */}
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
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "md:gap-3",
              "lg:gap-4",
            )}
          >
            {/* Avatar */}
            <div className={cn("relative", "shrink-0")}>
              <div
                className={cn(
                  "rounded-full bg-muted overflow-hidden border border-border",
                  "flex items-center justify-center font-black text-muted-foreground",
                  "w-7 h-7 text-[10px]", // mobile
                  "md:w-9 md:h-9 md:text-xs", // tablet
                  "lg:w-10 lg:h-10 lg:text-sm", // desktop
                )}
              >
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={resolveAdminFullName(user.fullName)}
                    width={40}
                    height={40}
                    className={cn("w-full", "h-full", "object-cover")}
                  />
                ) : (
                  <span>{resolveAdminInitial(user.fullName as never)}</span>
                )}
              </div>
              {user.isEmailVerified && (
                <div
                  className={cn(
                    "absolute",
                    "-bottom-0.5",
                    "-right-0.5",
                    "bg-background",
                    "rounded-full",
                    "p-0.5",
                    "shadow-sm",
                  )}
                >
                  <LuCircleCheck
                    className={cn(
                      "w-2.5",
                      "h-2.5",
                      "md:w-3",
                      "md:h-3",
                      "lg:w-3.5",
                      "lg:h-3.5",
                      "text-emerald-500",
                    )}
                  />
                </div>
              )}
            </div>

            {/* Name + ID */}
            <div className={cn("flex", "flex-col", "min-w-0")}>
              <span
                className={cn(
                  "font-bold tracking-tight transition-colors truncate",
                  "text-[11px] md:text-xs lg:text-sm", // size
                  "font-semibold md:font-bold lg:font-black", // weight
                  !user.isAccountActive
                    ? "text-muted-foreground line-through"
                    : "text-foreground group-hover:text-primary",
                )}
              >
                {resolveAdminFullName(user.fullName as never)}
              </span>
              {/* Vault ID — hide on smallest screens to save space */}
              <span
                className={cn(
                  "hidden",
                  "sm:block",
                  "text-[8px]",
                  "md:text-[9px]",
                  "font-medium",
                  "md:font-bold",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                  "mt-0.5",
                  "truncate",
                )}
              >
                {user.vaultId.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>
        </td>

        {/* ── Contact — lg+ ─────────────────────────────────────────────── */}
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
              "lg:gap-2",
              "text-slate-600",
            )}
          >
            <LuMail
              className={cn(
                "w-3",
                "h-3",
                "lg:w-3.5",
                "lg:h-3.5",
                "text-muted-foreground",
                "shrink-0",
              )}
            />
            <span
              className={cn(
                "text-[10px]",
                "lg:text-[11px]",
                "font-medium",
                "lg:font-bold",
                "truncate",
                "max-w-[130px]",
                "xl:max-w-[180px]",
              )}
            >
              {user.email}
            </span>
            <button
              onClick={copyEmail}
              className={cn(
                "p-1",
                "lg:p-1.5",
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
                        "lg:w-3.5",
                        "lg:h-3.5",
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
                      className={cn("w-3", "h-3", "lg:w-3.5", "lg:h-3.5")}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </td>

        {/* ── Status & Role ─────────────────────────────────────────────── */}
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
          <div
            className={cn(
              "flex",
              "flex-col",
              "gap-1",
              "md:gap-1.5",
              "lg:gap-2",
            )}
          >
            <span
              className={cn(
                "w-fit rounded border font-black uppercase",
                "px-1.5 py-0.5 text-[7px] tracking-[0.1em]", // mobile
                "md:px-2 md:text-[8px] md:tracking-[0.15em]", // tablet
                STATUS_STYLE,
              )}
            >
              {STATUS_LABEL}
            </span>
            {/* Role — hide on smallest, show sm+ */}
            <span
              className={cn(
                "hidden",
                "sm:block",
                "text-[8px]",
                "md:text-[9px]",
                "font-medium",
                "md:font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.1em]",
                "md:tracking-[0.15em]",
              )}
            >
              {user.role}
            </span>
          </div>
        </td>

        {/* ── Activity — xl+ ────────────────────────────────────────────── */}
        <td className={cn("hidden", "xl:table-cell", "px-6", "py-5")}>
          <div className={cn("flex", "flex-col", "gap-1.5")}>
            <div className={cn("flex", "items-center", "gap-1.5")}>
              <div
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-md",
                  user.analytics.eventsRegistered > 0
                    ? "bg-primary/20 text-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <LuTicket className={cn("w-3", "h-3")} />
              </div>
              <span
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "text-foreground",
                )}
              >
                {user.analytics.eventsRegistered}{" "}
                <span className={cn("text-muted-foreground", "font-bold")}>
                  Events
                </span>
              </span>
            </div>
            <span
              className={cn(
                "text-[9px]",
                "font-medium",
                "text-muted-foreground",
              )}
            >
              Attended: {user.analytics.eventsAttended}
            </span>
          </div>
        </td>

        {/* ── Actions ───────────────────────────────────────────────────── */}
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
                  className={cn("fixed", "inset-0", "z-10")}
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
                    "lg:w-52",
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
                    label="View Profile"
                    onClick={() => {
                      setShowMenu(false);
                      onViewDetails?.(user);
                    }}
                  />
                  <MenuItem
                    icon={LuSquarePen}
                    label="Edit Details"
                    onClick={() => {
                      setShowMenu(false);
                      setShowEditModal(true);
                    }}
                  />
                  <div className={cn("h-px", "bg-muted", "my-1")} />
                  <MenuItem
                    icon={LuShieldCheck}
                    label="Manage Role"
                    onClick={() => {
                      setShowMenu(false);
                      setShowRestrict(true);
                    }}
                    color="text-blue-600"
                  />
                  {user.isAccountActive ? (
                    <MenuItem
                      icon={LuShieldAlert}
                      label="Suspend"
                      onClick={() => {
                        setShowMenu(false);
                        handleSuspend();
                      }}
                      color="text-amber-600"
                    />
                  ) : (
                    <MenuItem
                      icon={LuCircleCheck}
                      label="Restore"
                      onClick={() => {
                        setShowMenu(false);
                        handleRestore();
                      }}
                      color="text-emerald-600"
                    />
                  )}
                  <MenuItem
                    icon={LuBan}
                    label="Ban Account"
                    onClick={() => {
                      setShowMenu(false);
                      setShowRestrict(true);
                    }}
                    color="text-rose-500"
                  />
                  <div className={cn("h-px", "bg-muted", "my-1")} />
                  <MenuItem
                    icon={LuTrash2}
                    label="Delete"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                    color="text-rose-600"
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </td>
      </motion.tr>

      <Portal>
        <AdminUserEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            onMutation?.();
          }}
          user={user}
        />
      </Portal>
      <Portal>
        <AdminUserRestrictModal
          isOpen={showRestrict}
          onClose={() => setShowRestrict(false)}
          onSuccess={() => {
            setShowRestrict(false);
            onMutation?.();
          }}
          user={user}
        />
      </Portal>
      <Portal>
        <AdminUserDeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            setShowDeleteModal(false);
            onMutation?.();
          }}
          userName={resolveAdminFullName(user.fullName as never)}
          userEmail={user.email}
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
