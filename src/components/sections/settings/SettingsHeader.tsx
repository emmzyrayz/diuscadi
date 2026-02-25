"use client";
import React from "react";
import { LuSettings, LuChevronRight, LuCircleUser } from "react-icons/lu";
import { cn } from "../../../lib/utils";
import Image from "next/image";

interface SettingsHeaderProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export const SettingsHeader = ({ user }: SettingsHeaderProps) => {
  return (
    <header
      className={cn("w-full", "bg-white", "border-b", "border-slate-100")}
    >
      <div
        className={cn(
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-8",
        )}
      >
        <div
          className={cn(
            "flex",
            "flex-col",
            "md:flex-row",
            "md:items-center",
            "justify-between",
            "gap-6",
          )}
        >
          {/* 1. Title & Breadcrumbs */}
          <div className="space-y-2">
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-2",
                "text-[10px]",
                "font-black",
                "text-slate-400",
                "uppercase",
                "tracking-[0.2em]",
              )}
            >
              <span>Console</span>
              <LuChevronRight className={cn("w-3", "h-3")} />
              <span className="text-primary">System Settings</span>
            </div>
            <h1
              className={cn(
                "text-3xl",
                "font-black",
                "text-slate-900",
                "tracking-tight",
              )}
            >
              Settings
            </h1>
          </div>

          {/* 2. ProfileQuickCard (Premium Orientation) */}
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-4",
              "p-3",
              "pr-6",
              "bg-slate-50",
              "rounded-[2rem]",
              "border",
              "border-slate-100",
              "hover:bg-white",
              "hover:shadow-xl",
              "hover:shadow-slate-200/50",
              "transition-all",
              "duration-500",
              "group",
            )}
          >
            <div
              className={cn(
                "w-12",
                "h-12",
                "rounded-2xl",
                "overflow-hidden",
                "border-2",
                "border-white",
                "shadow-sm",
                "shrink-0",
              )}
            >
              {user.avatar ? (
                <Image
                  height={300}
                  width={500}
                  src={user.avatar}
                  alt={user.name}
                  className={cn("w-full", "h-full", "object-cover")}
                />
              ) : (
                <div
                  className={cn(
                    "w-full",
                    "h-full",
                    "bg-slate-200",
                    "flex",
                    "items-center",
                    "justify-center",
                    "text-slate-400",
                  )}
                >
                  <LuCircleUser className={cn("w-6", "h-6")} />
                </div>
              )}
            </div>
            <div className={cn("flex", "flex-col")}>
              <span
                className={cn(
                  "text-xs",
                  "font-black",
                  "text-slate-900",
                  "leading-none",
                  "group-hover:text-primary",
                  "transition-colors",
                )}
              >
                {user.name}
              </span>
              <span
                className={cn(
                  "text-[10px]",
                  "font-bold",
                  "text-slate-400",
                  "mt-1",
                )}
              >
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
