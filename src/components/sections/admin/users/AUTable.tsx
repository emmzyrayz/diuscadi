"use client";
// AUTable.tsx
// Uses AdminUser from AdminContext — no MOCK_USERS, no fake avatars.
// Row actions call AdminContext.changeStatus / changeRole directly.
// Modals for view/edit/delete/restrict are opened via Portal.

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

// Re-export so page and detail modal can import from here
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
        "p-2",
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "overflow-hidden",
        "shadow-sm",
      )}
    >
      <div className={cn("overflow-x-auto")}>
        <table
          className={cn(
            "w-full",
            "text-left",
            "border-collapse",
            "min-w-[1000px]",
          )}
        >
          <thead>
            <tr className={cn("bg-muted/50", "border-b", "border-border")}>
              <th className={cn("pl-8", "pr-4", "py-5", "w-10")}>
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
              {[
                "Identity & Profile",
                "Contact",
                "Status & Role",
                "Activity",
                "Actions",
              ].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "px-6",
                    "py-5",
                    "text-[10px]",
                    "font-black",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-[0.2em]",
                    i === 4 && "text-right px-8",
                  )}
                >
                  {h}
                </th>
              ))}
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
                delay={0.1 + index * 0.05}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// ── Row ───────────────────────────────────────────────────────────────────────

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
          "group",
          "transition-all",
          isSelected ? "bg-primary/5" : "hover:bg-muted/50",
          !user.isAccountActive && "opacity-75",
        )}
      >
        {/* Checkbox */}
        <td className={cn("pl-8", "pr-4", "py-5", "relative")}>
          {!user.isAccountActive && (
            <div
              className={cn(
                "absolute",
                "left-0",
                "top-0",
                "bottom-0",
                "w-1",
                isBanned ? "bg-rose-500" : "bg-amber-500",
              )}
            />
          )}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
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
        </td>

        {/* Identity */}
        <td className={cn("px-6", "py-5")}>
          <div className={cn("flex", "items-center", "gap-4")}>
            <div className="relative">
              <div
                className={cn(
                  "w-10",
                  "h-10",
                  "rounded-full",
                  "bg-muted",
                  "overflow-hidden",
                  "border",
                  "border-border",
                  "shrink-0",
                  "flex",
                  "items-center",
                  "justify-center",
                  "text-sm",
                  "font-black",
                  "text-muted-foreground",
                )}
              >
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={user.fullName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {user.isEmailVerified && (
                <div
                  className={cn(
                    "absolute",
                    "-bottom-1",
                    "-right-1",
                    "bg-background",
                    "rounded-full",
                    "p-0.5",
                    "shadow-sm",
                  )}
                >
                  <LuCircleCheck
                    className={cn("w-3.5", "h-3.5", "text-emerald-500")}
                  />
                </div>
              )}
            </div>
            <div className={cn("flex", "flex-col")}>
              <span
                className={cn(
                  "text-sm",
                  "font-black",
                  "tracking-tight",
                  "transition-colors",
                  !user.isAccountActive
                    ? "text-muted-foreground line-through"
                    : "text-foreground group-hover:text-primary",
                )}
              >
                {user.fullName}
              </span>
              <span
                className={cn(
                  "text-[9px]",
                  "font-bold",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                  "mt-0.5",
                )}
              >
                {user.vaultId.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>
        </td>

        {/* Contact */}
        <td className={cn("px-6", "py-5")}>
          <div
            className={cn("flex", "items-center", "gap-2", "text-slate-600")}
          >
            <LuMail className={cn("w-3.5", "h-3.5", "text-muted-foreground")} />
            <span
              className={cn(
                "text-[11px]",
                "font-bold",
                "truncate",
                "max-w-[180px]",
              )}
            >
              {user.email}
            </span>
            <button
              onClick={copyEmail}
              className={cn(
                "p-1.5",
                "hover:bg-slate-200",
                "rounded-md",
                "text-muted-foreground",
                "hover:text-foreground",
                "transition-colors",
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
                      className={cn("w-3.5", "h-3.5", "text-emerald-500")}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="u"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <LuCopy className={cn("w-3.5", "h-3.5")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </td>

        {/* Status & Role */}
        <td className={cn("px-6", "py-5")}>
          <div className={cn("flex", "flex-col", "gap-2")}>
            <span
              className={cn(
                "w-fit",
                "px-2",
                "py-0.5",
                "rounded",
                "border",
                "text-[8px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                STATUS_STYLE,
              )}
            >
              {STATUS_LABEL}
            </span>
            <span
              className={cn(
                "text-[9px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-[0.15em]",
              )}
            >
              {user.role} · {user.eduStatus}
            </span>
          </div>
        </td>

        {/* Activity */}
        <td className={cn("px-6", "py-5")}>
          <div className={cn("flex", "flex-col", "gap-1.5")}>
            <div className={cn("flex", "items-center", "gap-1.5")}>
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "justify-center",
                  "w-5",
                  "h-5",
                  "rounded-md",
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

        {/* Actions */}
        <td className={cn("px-8", "py-5", "text-right", "relative")}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "p-2",
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
            <LuEllipsis className={cn("w-5", "h-5")} />
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
                    "right-8",
                    "top-12",
                    "w-52",
                    "bg-background",
                    "border",
                    "border-border",
                    "rounded-2xl",
                    "shadow-2xl",
                    "z-20",
                    "p-2",
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
                      label="Suspend User"
                      onClick={() => handleSuspend()}
                      color="text-amber-600"
                    />
                  ) : (
                    <MenuItem
                      icon={LuCircleCheck}
                      label="Restore Account"
                      onClick={() => handleRestore()}
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
                    label="Delete Permanently"
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

      {/* Modals via Portal */}
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
          userName={user.fullName}
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
      "w-full",
      "flex",
      "items-center",
      "gap-3",
      "px-3",
      "py-2.5",
      "rounded-xl",
      "hover:bg-muted",
      "transition-colors",
      "cursor-pointer",
      color,
    )}
  >
    <Icon className={cn("w-4", "h-4")} />
    <span
      className={cn("text-[10px]", "font-black", "uppercase", "tracking-tight")}
    >
      {label}
    </span>
  </button>
);
