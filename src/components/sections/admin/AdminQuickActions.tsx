"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuPlus,
  LuUsers,
  LuTicket,
  LuDownload,
  LuCommand,
  LuZap,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { IconType } from "react-icons";

interface ActionButtonProps {
  icon: IconType;
  label: string;
  shortcut: string;
  primary?: boolean;
  delay?: number;
  onClick: () => void;
}

export const AdminQuickActions = () => {
  const router = useRouter();

  const quickActions = [
    {
      icon: LuPlus,
      label: "Create Event",
      shortcut: "N",
      primary: true,
      onClick: () => router.push("/admin/events?action=create"),
    },
    {
      icon: LuUsers,
      label: "View User Base",
      shortcut: "U",
      primary: false,
      onClick: () => router.push("/admin/users"),
    },
    {
      icon: LuTicket,
      label: "Manage Tickets",
      shortcut: "T",
      primary: false,
      onClick: () => router.push("/admin/tickets"),
    },
    {
      icon: LuDownload,
      label: "Export Manifest",
      shortcut: "E",
      primary: false,
      onClick: () => router.push("/admin/analytics"),
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-foreground",
        "rounded-[2.5rem]",
        "p-8",
        "text-background",
        "shadow-2xl",
        "relative",
        "overflow-hidden",
        "group",
      )}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute",
          "top-0",
          "right-0",
          "w-96",
          "h-96",
          "bg-primary/5",
          "rounded-full",
          "blur-[100px]",
          "-mr-48",
          "-mt-48",
        )}
      />
      <div className={cn("relative", "z-10")}>
        <div className={cn("flex", "items-center", "justify-between", "mb-8")}>
          <div className={cn("flex", "items-center", "gap-3")}>
            <div
              className={cn(
                "w-8",
                "h-8",
                "rounded-lg",
                "bg-background/10",
                "flex",
                "items-center",
                "justify-center",
                "text-primary",
              )}
            >
              <LuCommand className={cn("w-4", "h-4")} />
            </div>
            <h3
              className={cn(
                "text-sm",
                "font-black",
                "uppercase",
                "tracking-[0.3em]",
                "text-muted-foreground",
              )}
            >
              Command Center
            </h3>
          </div>
          <div
            className={cn(
              "hidden",
              "md:flex",
              "items-center",
              "gap-2",
              "px-3",
              "py-1",
              "bg-background/5",
              "rounded-full",
              "border",
              "border-background/5",
            )}
          >
            <LuZap className={cn("w-3", "h-3", "text-primary")} />
            <span
              className={cn(
                "text-[8px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-muted-foreground",
              )}
            >
              Fast Actions
            </span>
          </div>
        </div>
        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "sm:grid-cols-2",
            "xl:grid-cols-4",
            "gap-4",
          )}
        >
          {quickActions.map((action, index) => (
            <ActionButton
              key={action.label}
              {...action}
              delay={0.4 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
};

const ActionButton = ({
  icon: Icon,
  label,
  shortcut,
  primary = false,
  delay = 0,
  onClick,
}: ActionButtonProps) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: primary ? 1.02 : 1.01, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "group",
      "flex",
      "items-center",
      "justify-between",
      "px-6",
      "py-5",
      "rounded-2xl",
      "transition-all",
      "duration-300",
      "cursor-pointer",
      primary
        ? "bg-secondary text-foreground shadow-xl shadow-primary/20"
        : "bg-background/5 text-background border border-background/5 hover:bg-background/10",
    )}
  >
    <div className={cn("flex", "items-center", "gap-4")}>
      <div
        className={cn(
          "w-10",
          "h-10",
          "rounded-xl",
          "flex",
          "items-center",
          "justify-center",
          "transition-colors",
          "duration-300",
          primary
            ? "bg-foreground/10"
            : "bg-background/5 group-hover:bg-primary/20 group-hover:text-primary",
        )}
      >
        <Icon className={cn("w-5", "h-5")} />
      </div>
      <span
        className={cn(
          "text-[11px]",
          "font-black",
          "uppercase",
          "tracking-wider",
        )}
      >
        {label}
      </span>
    </div>
    <div
      className={cn(
        "hidden",
        "xl:flex",
        "w-6",
        "h-6",
        "items-center",
        "justify-center",
        "rounded-md",
        "border",
        "text-[9px]",
        "font-black",
        primary
          ? "border-foreground/20 text-foreground/40"
          : "border-background/10 text-slate-600",
      )}
    >
      {shortcut}
    </div>
  </motion.button>
);
