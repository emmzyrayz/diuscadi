"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuSearch,
  LuShieldCheck,
  LuCircleUser,
  LuGraduationCap,
  LuArrowUpDown,
  LuRotateCcw,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

interface Props {
  onSearchChange?: (v: string) => void;
  onRoleChange?: (v: string) => void;
  onStatusChange?: (v: string) => void;
}

export const AdminUsersToolbar: React.FC<Props> = ({
  onSearchChange,
  onRoleChange,
  onStatusChange,
}) => {
  const [search, setSearch] = useState("");
  const [verification, setVerification] = useState("All");
  const [account, setAccount] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("Recent");

  const reset = () => {
    setSearch("");
    setVerification("All");
    setAccount("All");
    setType("All");
    setSort("Recent");
    onSearchChange?.("");
    onRoleChange?.("");
    onStatusChange?.("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2rem]",
        "p-5",
        "mb-8",
        "shadow-sm",
      )}
    >
      <div
        className={cn(
          "flex",
          "flex-col",
          "2xl:flex-row",
          "items-center",
          "gap-5",
        )}
      >
        <div className={cn("relative", "w-full", "2xl:w-[450px]")}>
          <LuSearch
            className={cn(
              "absolute",
              "left-5",
              "top-1/2",
              "-translate-y-1/2",
              "text-muted-foreground",
              "w-4",
              "h-4",
            )}
          />
          <input
            type="text"
            placeholder="Search by Name, Email, or Invite Code..."
            className={cn(
              "w-full",
              "bg-muted",
              "border",
              "border-border",
              "rounded-2xl",
              "pl-12",
              "pr-4",
              "py-4",
              "text-[11px]",
              "font-black",
              "text-foreground",
              "placeholder:text-muted-foreground",
              "outline-none",
              "focus:ring-4",
              "focus:ring-primary/10",
              "focus:border-primary",
              "transition-all",
              "uppercase",
              "tracking-tight",
            )}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
          />
        </div>
        <div
          className={cn(
            "flex",
            "flex-wrap",
            "items-center",
            "gap-3",
            "w-full",
            "2xl:w-auto",
          )}
        >
          <Dropdown
            label="Verification"
            icon={LuShieldCheck}
            current={verification}
            options={["All", "Verified", "Unverified", "Incomplete"]}
            onChange={(v) => {
              setVerification(v);
              onStatusChange?.(v === "All" ? "" : v.toLowerCase());
            }}
          />
          <Dropdown
            label="Account"
            icon={LuCircleUser}
            current={account}
            options={["All", "Active", "Suspended", "Banned"]}
            onChange={(v) => {
              setAccount(v);
              onStatusChange?.(v === "All" ? "" : v.toLowerCase());
            }}
          />
          <Dropdown
            label="Reg. Type"
            icon={LuGraduationCap}
            current={type}
            options={["All", "student", "alumni", "professional"]}
            onChange={(v) => {
              setType(v);
              onRoleChange?.(v === "All" ? "" : v.toLowerCase());
            }}
          />
          <Dropdown
            label="Sort By"
            icon={LuArrowUpDown}
            current={sort}
            options={["Recent", "Name", "ID"]}
            onChange={setSort}
          />
          <div
            className={cn(
              "h-10",
              "w-px",
              "bg-muted",
              "mx-2",
              "hidden",
              "xl:block",
            )}
          />
          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "px-4",
              "py-3",
              "bg-muted",
              "text-muted-foreground",
              "rounded-xl",
              "hover:bg-foreground",
              "hover:text-background",
              "transition-all",
            )}
          >
            <LuRotateCcw className={cn("w-4", "h-4")} />
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
              )}
            >
              Reset
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const Dropdown: React.FC<{
  label: string;
  icon: IconType;
  current: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, icon: Icon, current, options, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn("relative", "min-w-[140px]")}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={cn(
          "w-full",
          "flex",
          "items-center",
          "justify-between",
          "gap-3",
          "px-4",
          "py-3",
          "bg-background",
          "border",
          "border-border",
          "rounded-xl",
          "transition-all",
        )}
      >
        <div className={cn("flex", "items-center", "gap-3", "text-left")}>
          <Icon className={cn("w-4", "h-4", "text-muted-foreground")} />
          <div>
            <p
              className={cn(
                "text-[8px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "leading-none",
                "mb-0.5",
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "text-[10px]",
                "font-black",
                "text-foreground",
                "uppercase",
                "tracking-tight",
              )}
            >
              {current}
            </p>
          </div>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "absolute",
              "top-full",
              "left-0",
              "mt-2",
              "w-full",
              "min-w-[180px]",
              "bg-background",
              "border",
              "border-border",
              "rounded-2xl",
              "shadow-2xl",
              "p-2",
              "z-40",
            )}
          >
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  "w-full",
                  "text-left",
                  "px-4",
                  "py-3",
                  "rounded-xl",
                  "text-[10px]",
                  "font-black",
                  "text-slate-600",
                  "uppercase",
                  "tracking-widest",
                  "hover:bg-muted",
                  "hover:text-primary",
                  "transition-colors",
                  "flex",
                  "items-center",
                  "justify-between",
                )}
              >
                {opt}
                {current === opt && (
                  <div
                    className={cn(
                      "w-1.5",
                      "h-1.5",
                      "rounded-full",
                      "bg-primary",
                    )}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
