"use client";
import Image from "next/image";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconType } from "react-icons";
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
} from "react-icons/lu";
import { cn } from "@/lib/utils";

// 1. TypeScript Interfaces
export interface UserRowData {
  id: string;
  name: string;
  avatar: string;
  email: string;
  type: "Student" | "Graduate" | "Professional";
  isVerified: boolean;
  accountStatus: "Active" | "Suspended" | "Banned";
  ticketsCount: number;
  lastActive: string;
}

interface AdminUsersTableProps {
  onViewDetails?: (user: UserRowData) => void;
}

interface UserRowProps {
  user: UserRowData;
  isSelected: boolean;
  onToggle: () => void;
  onViewDetails?: (user: UserRowData) => void;
  delay?: number;
}

interface DropdownItemProps {
  icon: IconType;
  label: string;
  color?: string;
  onClick?: () => void;
}

const MOCK_USERS: UserRowData[] = [
  {
    id: "USR-8921",
    name: "Sarah Olanrewaju",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    email: "sarah.o@example.com",
    type: "Professional",
    isVerified: true,
    accountStatus: "Active",
    ticketsCount: 3,
    lastActive: "2 hours ago",
  },
  {
    id: "USR-4432",
    name: "David Chen",
    avatar: "https://i.pravatar.cc/150?u=david",
    email: "david.c@student.edu",
    type: "Student",
    isVerified: false,
    accountStatus: "Active",
    ticketsCount: 1,
    lastActive: "1 day ago",
  },
  {
    id: "USR-9910",
    name: "Marcus Johnson",
    avatar: "https://i.pravatar.cc/150?u=marcus",
    email: "mjohnson@spam.com",
    type: "Graduate",
    isVerified: false,
    accountStatus: "Banned",
    ticketsCount: 0,
    lastActive: "2 weeks ago",
  },
];

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  onViewDetails,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedUsers.size === MOCK_USERS.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(MOCK_USERS.map((u) => u.id)));
    }
  };

  const toggleUser = (id: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUsers(newSet);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "w-full p-2",
        "bg-white",
        "border-2",
        "border-slate-100",
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
          {/* Table Header */}
          <thead>
            <motion.tr
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn("bg-slate-50/50", "border-b", "border-slate-100")}
            >
              <th className={cn("pl-8", "pr-4", "py-5", "w-10")}>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === MOCK_USERS.length}
                    onChange={toggleSelectAll}
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
                </motion.div>
              </th>
              <th
                className={cn(
                  "px-6",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                )}
              >
                Identity & Profile
              </th>
              <th
                className={cn(
                  "px-6",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                )}
              >
                Contact
              </th>
              <th
                className={cn(
                  "px-6",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                )}
              >
                Status & Role
              </th>
              <th
                className={cn(
                  "px-6",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                )}
              >
                Activity
              </th>
              <th
                className={cn(
                  "px-8",
                  "py-5",
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-[0.2em]",
                  "text-right",
                )}
              >
                Actions
              </th>
            </motion.tr>
          </thead>

          {/* Table Body */}
          <tbody className={cn("divide-y", "divide-slate-50")}>
            {MOCK_USERS.map((user, index) => (
              <AdminUserRow
                key={user.id}
                user={user}
                isSelected={selectedUsers.has(user.id)}
                onToggle={() => toggleUser(user.id)}
                onViewDetails={onViewDetails}
                delay={0.3 + index * 0.1}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

/* --- Internal Component: AdminUserRow --- */
const AdminUserRow: React.FC<UserRowProps> = ({
  user,
  isSelected,
  onToggle,
  onViewDetails,
  delay = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBanned = user.accountStatus === "Banned";

  const handleAction = (action: string) => {
    console.log(`Action: ${action} for user ${user.id}`);
    setShowDropdown(false);
    if (action === "view" && onViewDetails) {
      onViewDetails(user);
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "group",
        "transition-all",
        isSelected ? "bg-primary/5" : "hover:bg-slate-50/50",
        isBanned && "opacity-75 grayscale",
      )}
    >
      {/* Checkbox */}
      <td className={cn("pl-8", "pr-4", "py-5", "relative")}>
        {isBanned && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            className={cn(
              "absolute",
              "left-0",
              "top-0",
              "bottom-0",
              "w-1",
              "bg-rose-500",
            )}
          />
        )}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
        </motion.div>
      </td>

      {/* Identity */}
      <td className={cn("px-6", "py-5")}>
        <div className={cn("flex", "items-center", "gap-4")}>
          <div className={cn("relative")}>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "w-10",
                "h-10",
                "rounded-full",
                "bg-slate-200",
                "overflow-hidden",
                "border",
                "border-slate-200",
                "shrink-0",
              )}
            >
              <Image
                height={300}
                width={500}
                src={user.avatar}
                alt={user.name}
                className={cn("w-full", "h-full", "object-cover")}
              />
            </motion.div>
            <AnimatePresence>
              {user.isVerified && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className={cn(
                    "absolute",
                    "-bottom-1",
                    "-right-1",
                    "bg-white",
                    "rounded-full",
                    "p-0.5",
                    "shadow-sm",
                  )}
                >
                  <LuCircleCheck
                    className={cn("w-4", "h-4", "text-emerald-500")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className={cn("flex", "flex-col")}>
            <span
              className={cn(
                "text-sm",
                "font-black",
                "tracking-tight",
                "transition-colors",
                isBanned
                  ? "text-slate-500 line-through"
                  : "text-slate-900 group-hover:text-primary",
              )}
            >
              {user.name}
            </span>
            <span
              className={cn(
                "text-[9px]",
                "font-bold",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
                "mt-0.5",
              )}
            >
              ID: {user.id}
            </span>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className={cn("px-6", "py-5")}>
        <div className={cn("flex", "items-center", "gap-2", "text-slate-600")}>
          <LuMail className={cn("w-3.5", "h-3.5", "text-slate-400")} />
          <span className={cn("text-[11px]", "font-bold")}>{user.email}</span>
          <motion.button
            onClick={copyEmail}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "p-1.5",
              "hover:bg-slate-200",
              "rounded-md",
              "text-slate-400",
              "hover:text-slate-900",
              "transition-colors",
            )}
            title="Copy Email"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                >
                  <LuCircleCheck
                    className={cn("w-3.5", "h-3.5", "text-emerald-500")}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <LuCopy className={cn("w-3.5", "h-3.5")} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </td>

      {/* Status & Role */}
      <td className={cn("px-6", "py-5")}>
        <div className={cn("flex", "flex-col", "gap-2")}>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
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
              user.accountStatus === "Active"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : user.accountStatus === "Suspended"
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : "bg-rose-50 text-rose-600 border-rose-100",
            )}
          >
            {user.accountStatus}
          </motion.span>
          <span
            className={cn(
              "text-[9px]",
              "font-black",
              "text-slate-500",
              "uppercase",
              "tracking-[0.15em]",
            )}
          >
            {user.type}
          </span>
        </div>
      </td>

      {/* Activity / Tickets */}
      <td className={cn("px-6", "py-5")}>
        <div className={cn("flex", "flex-col", "gap-1.5")}>
          <div className={cn("flex", "items-center", "gap-1.5")}>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                "flex",
                "items-center",
                "justify-center",
                "w-5",
                "h-5",
                "rounded-md",
                user.ticketsCount > 0
                  ? "bg-primary/20 text-slate-900"
                  : "bg-slate-100 text-slate-400",
              )}
            >
              <LuTicket className={cn("w-3", "h-3")} />
            </motion.div>
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-slate-900",
              )}
            >
              {user.ticketsCount}{" "}
              <span className={cn("text-slate-400", "font-bold")}>Tickets</span>
            </span>
          </div>
          <span className={cn("text-[9px]", "font-medium", "text-slate-400")}>
            Last active: {user.lastActive}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className={cn("px-8", "py-5", "text-right", "relative")}>
        <motion.button
          onClick={() => setShowDropdown(!showDropdown)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "p-2",
            "hover:bg-white",
            "border",
            "border-transparent",
            "hover:border-slate-200",
            "rounded-lg",
            "text-slate-400",
            "hover:text-slate-900",
            "transition-all",
          )}
        >
          <motion.div
            animate={showDropdown ? { rotate: 90 } : { rotate: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LuEllipsis className={cn("w-5", "h-5")} />
          </motion.div>
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showDropdown && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn("fixed", "inset-0", "z-10")}
                onClick={() => setShowDropdown(false)}
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
                  "w-48",
                  "bg-white",
                  "border",
                  "border-slate-100",
                  "rounded-2xl",
                  "shadow-2xl",
                  "z-20",
                  "p-2",
                )}
              >
                <DropdownItem
                  icon={LuEye}
                  label="View Profile"
                  onClick={() => handleAction("view")}
                />
                <DropdownItem
                  icon={LuSquarePen}
                  label="Edit Details"
                  onClick={() => handleAction("edit")}
                />
                <div className={cn("h-px", "bg-slate-50", "my-1")} />
                {!isBanned ? (
                  <>
                    <DropdownItem
                      icon={LuShieldAlert}
                      label="Suspend User"
                      color="text-amber-600"
                      onClick={() => handleAction("suspend")}
                    />
                    <DropdownItem
                      icon={LuBan}
                      label="Ban Account"
                      color="text-rose-600"
                      onClick={() => handleAction("ban")}
                    />
                  </>
                ) : (
                  <DropdownItem
                    icon={LuCircleCheck}
                    label="Restore Account"
                    color="text-emerald-600"
                    onClick={() => handleAction("restore")}
                  />
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
};

/* --- Internal Helper --- */
const DropdownItem: React.FC<DropdownItemProps> = ({
  icon: Icon,
  label,
  color = "text-slate-600",
  onClick,
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02, x: 2 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      "w-full",
      "flex",
      "items-center",
      "gap-3",
      "px-3",
      "py-2.5",
      "rounded-xl",
      "hover:bg-slate-50",
      "transition-colors",
      color,
    )}
  >
    <Icon className={cn("w-4", "h-4")} />
    <span
      className={cn("text-[10px]", "font-black", "uppercase", "tracking-tight")}
    >
      {label}
    </span>
  </motion.button>
);

// Export types
export type { AdminUsersTableProps, UserRowProps, DropdownItemProps };
