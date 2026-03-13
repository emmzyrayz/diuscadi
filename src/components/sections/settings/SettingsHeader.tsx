"use client";
import React from "react";
import { LuSettings, LuChevronRight, LuCircleUser } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { UserProfile } from "@/context/UserContext";

interface SettingsHeaderProps {
  profile: UserProfile | null;
}

export const SettingsHeader = ({ profile }: SettingsHeaderProps) => {
  const name = profile?.fullName ?? "Loading…";
  const email = profile?.email ?? "";
  const avatar = profile?.avatar;

  return (
    <header
      className={cn("w-full", "bg-background", "border-b", "border-border")}
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
          {/* Breadcrumb + title */}
          <div className="space-y-2">
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-2",
                "text-[10px]",
                "font-black",
                "text-muted-foreground",
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
                "text-foreground",
                "tracking-tight",
              )}
            >
              Settings
            </h1>
          </div>

          {/* Profile quick-card */}
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-4",
              "p-3",
              "pr-6",
              "bg-muted",
              "rounded-[2rem]",
              "border",
              "border-border",
              "hover:bg-background",
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
                "border-background",
                "shadow-sm",
                "shrink-0",
              )}
            >
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  width={48}
                  height={48}
                  className={cn("w-full", "h-full", "object-cover")}
                />
              ) : (
                <div
                  className={cn(
                    "w-full",
                    "h-full",
                    "text-muted",
                    "flex",
                    "items-center",
                    "justify-center",
                    "text-muted-foreground",
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
                  "text-foreground",
                  "leading-none",
                  "group-hover:text-primary",
                  "transition-colors",
                )}
              >
                {name}
              </span>
              <span
                className={cn(
                  "text-[10px]",
                  "font-bold",
                  "text-muted-foreground",
                  "mt-1",
                )}
              >
                {email}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
