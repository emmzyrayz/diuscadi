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

// 1. TypeScript Interfaces
interface UserFilters {
  search: string;
  verification: "All" | "Verified" | "Unverified" | "Incomplete";
  account: "All" | "Active" | "Suspended" | "Banned";
  type: "All" | "Student" | "Graduate" | "Professional";
  sort: "Recent" | "Name" | "ID";
}

interface UserFilterDropdownProps {
  label: string;
  icon: IconType;
  current: string;
  options: string[];
  onChange: (value: string) => void;
  delay?: number;
}

export const AdminUsersToolbar: React.FC = () => {
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    verification: "All",
    account: "All",
    type: "All",
    sort: "Recent",
  });

  const resetFilters = () =>
    setFilters({
      search: "",
      verification: "All",
      account: "All",
      type: "All",
      sort: "Recent",
    });

  const updateFilter = <K extends keyof UserFilters>(
    key: K,
    value: UserFilters[K],
  ) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-white",
        "border-2",
        "border-slate-100",
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
        {/* 1. Global Identity Search */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={cn("relative", "w-full", "2xl:w-[450px]")}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className={cn(
              "absolute",
              "left-5",
              "top-1/2",
              "-translate-y-1/2",
              "text-slate-400",
            )}
          >
            <LuSearch className={cn("w-4", "h-4")} />
          </motion.div>
          <input
            type="text"
            placeholder="Search by Name, Email, or Invite Code..."
            className={cn(
              "w-full",
              "bg-slate-50",
              "border",
              "border-slate-100",
              "rounded-2xl",
              "pl-12",
              "pr-4",
              "py-4",
              "text-[11px]",
              "font-black",
              "text-slate-900",
              "placeholder:text-slate-400",
              "outline-none",
              "focus:ring-4",
              "focus:ring-primary/10",
              "focus:border-primary",
              "transition-all",
              "uppercase",
              "tracking-tight",
            )}
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </motion.div>

        {/* 2. Filter Matrix */}
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
          <UserFilterDropdown
            label="Verification"
            icon={LuShieldCheck}
            current={filters.verification}
            options={["All", "Verified", "Unverified", "Incomplete"]}
            onChange={(value) =>
              updateFilter("verification", value as UserFilters["verification"])
            }
            delay={0.2}
          />

          <UserFilterDropdown
            label="Account"
            icon={LuCircleUser}
            current={filters.account}
            options={["All", "Active", "Suspended", "Banned"]}
            onChange={(value) =>
              updateFilter("account", value as UserFilters["account"])
            }
            delay={0.25}
          />

          <UserFilterDropdown
            label="Reg. Type"
            icon={LuGraduationCap}
            current={filters.type}
            options={["All", "Student", "Graduate", "Professional"]}
            onChange={(value) =>
              updateFilter("type", value as UserFilters["type"])
            }
            delay={0.3}
          />

          <UserFilterDropdown
            label="Sort By"
            icon={LuArrowUpDown}
            current={filters.sort}
            options={["Recent", "Name", "ID"]}
            onChange={(value) =>
              updateFilter("sort", value as UserFilters["sort"])
            }
            delay={0.35}
          />

          {/* 3. Utilities */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.4 }}
            className={cn(
              "h-10",
              "w-px",
              "bg-slate-100",
              "mx-2",
              "hidden",
              "xl:block",
            )}
          />

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={resetFilters}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "px-4",
              "py-3",
              "bg-slate-50",
              "text-slate-500",
              "rounded-xl",
              "hover:bg-slate-900",
              "hover:text-white",
              "transition-all",
              "group",
            )}
          >
            <motion.div
              whileHover={{ rotate: -90 }}
              transition={{ duration: 0.5 }}
            >
              <LuRotateCcw className={cn("w-4", "h-4")} />
            </motion.div>
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

/* --- Internal Helper: UserFilterDropdown --- */
const UserFilterDropdown: React.FC<UserFilterDropdownProps> = ({
  label,
  icon: Icon,
  current,
  options,
  onChange,
  delay = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("relative", "group", "min-w-[140px]")}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <motion.button
        whileHover={{ scale: 1.02, borderColor: "rgb(15 23 42)" }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full",
          "flex",
          "items-center",
          "justify-between",
          "gap-3",
          "px-4",
          "py-3",
          "bg-white",
          "border",
          "border-slate-200",
          "rounded-xl",
          "transition-all",
        )}
      >
        <div className={cn("flex", "items-center", "gap-3", "text-left")}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Icon
              className={cn(
                "w-4",
                "h-4",
                "text-slate-400",
                "group-hover:text-primary",
                "transition-colors",
              )}
            />
          </motion.div>
          <div>
            <p
              className={cn(
                "text-[8px]",
                "font-black",
                "text-slate-400",
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
                "text-slate-900",
                "uppercase",
                "tracking-tight",
              )}
            >
              {current}
            </p>
          </div>
        </div>
      </motion.button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
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
              "bg-white",
              "border",
              "border-slate-100",
              "rounded-2xl",
              "shadow-2xl",
              "p-2",
              "z-40",
            )}
          >
            {options.map((opt, index) => (
              <motion.button
                key={opt}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(opt)}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
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
                  "hover:bg-slate-50",
                  "hover:text-primary",
                  "transition-colors",
                  "flex",
                  "items-center",
                  "justify-between",
                )}
              >
                {opt}
                <AnimatePresence>
                  {current === opt && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                      }}
                      className={cn(
                        "w-1.5",
                        "h-1.5",
                        "rounded-full",
                        "bg-primary",
                      )}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Export types
export type { UserFilters, UserFilterDropdownProps };
