"use client";
import React from "react";
import { cn } from "../../../../lib/utils";
import {
  LuBriefcase,
  LuBuilding2,
  LuGraduationCap,
  LuChartBar,
} from "react-icons/lu";
import { useUser } from "@/context/UserContext";

export const ProfessionalInfoSection = () => {
  const { profile } = useUser();

  // Read-only display of institution data from UserContext.
  // These fields are managed via Settings → Account (institution linking).
  // The edit page only allows basic info + bio edits for now.
  const institutionName = profile?.Institution?.name ?? "";
  const level = profile?.Institution?.level ?? "";

  return (
    <section
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
        "transition-all",
        "hover:border-primary/20",
      )}
    >
      <div className={cn("flex", "items-center", "gap-3", "mb-10")}>
        <div
          className={cn(
            "w-10",
            "h-10",
            "rounded-xl",
            "bg-muted",
            "flex",
            "items-center",
            "justify-center",
            "text-primary",
            "border",
            "border-border",
          )}
        >
          <LuBriefcase className={cn("w-5", "h-5")} />
        </div>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-foreground",
              "tracking-tight",
            )}
          >
            Professional Background
          </h3>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "mt-1",
            )}
          >
            Help us tailor your DIUSCADI experience
          </p>
        </div>
      </div>

      <div
        className={cn(
          "grid",
          "grid-cols-1",
          "md:grid-cols-2",
          "gap-x-8",
          "gap-y-8",
        )}
      >
        {/* Primary Path — derived from eduStatus */}
        <div className="space-y-2">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "ml-1",
            )}
          >
            Primary Path
          </label>
          <div className="relative">
            <LuGraduationCap
              className={cn(
                "absolute",
                "left-6",
                "top-1/2",
                "-translate-y-1/2",
                "text-muted-foreground",
                "w-4",
                "h-4",
              )}
            />
            <input
              type="text"
              value={profile?.eduStatus ?? ""}
              readOnly
              className={cn(
                "w-full",
                "text-muted",
                "border-2",
                "border-border",
                "rounded-2xl",
                "pl-12",
                "pr-6",
                "py-4",
                "text-sm",
                "font-bold",
                "text-muted-foreground",
                "cursor-not-allowed",
              )}
            />
          </div>
          <p
            className={cn(
              "text-[9px]",
              "text-muted-foreground",
              "font-bold",
              "ml-1",
            )}
          >
            Set during signup — contact support to change
          </p>
        </div>

        {/* Organization / Institution — from UserContext */}
        <div className="space-y-2">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "ml-1",
            )}
          >
            Organization / School
          </label>
          <div className="relative">
            <LuBuilding2
              className={cn(
                "absolute",
                "left-6",
                "top-1/2",
                "-translate-y-1/2",
                "text-muted-foreground",
                "w-4",
                "h-4",
              )}
            />
            <input
              type="text"
              value={institutionName}
              readOnly
              placeholder="No institution linked"
              className={cn(
                "w-full",
                "text-muted",
                "border-2",
                "border-border",
                "rounded-2xl",
                "pl-12",
                "pr-6",
                "py-4",
                "text-sm",
                "font-bold",
                "text-muted-foreground",
                "cursor-not-allowed",
              )}
            />
          </div>
          <p
            className={cn(
              "text-[9px]",
              "text-muted-foreground",
              "font-bold",
              "ml-1",
            )}
          >
            Link your institution via Settings → Account
          </p>
        </div>

        {/* Current Level — from UserContext */}
        <div className="space-y-2">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "ml-1",
            )}
          >
            Current Level
          </label>
          <input
            type="text"
            value={level}
            readOnly
            placeholder="e.g. 300 Level"
            className={cn(
              "w-full",
              "text-muted",
              "border-2",
              "border-border",
              "rounded-2xl",
              "px-6",
              "py-4",
              "text-sm",
              "font-bold",
              "text-muted-foreground",
              "cursor-not-allowed",
            )}
          />
        </div>

        {/* Experience Level — TODO: add to UserData schema when needed */}
        <div className="space-y-2">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "ml-1",
            )}
          >
            Experience Level
          </label>
          <div className="relative">
            <LuChartBar
              className={cn(
                "absolute",
                "left-6",
                "top-1/2",
                "-translate-y-1/2",
                "text-muted-foreground",
                "w-4",
                "h-4",
              )}
            />
            <select
              className={cn(
                "w-full",
                "bg-muted",
                "border-2",
                "border-slate-50",
                "rounded-2xl",
                "pl-12",
                "pr-6",
                "py-4",
                "text-sm",
                "font-bold",
                "text-slate-700",
                "outline-none",
                "focus:border-primary/20",
                "focus:bg-background",
                "transition-all",
                "appearance-none",
                "cursor-pointer",
              )}
            >
              <option value="entry">Entry Level / Undergraduate</option>
              <option value="mid">Mid-Level / Graduate</option>
              <option value="senior">Senior / Professional</option>
              <option value="expert">Expert / Founder</option>
            </select>
          </div>
          {/* TODO: persist to UserData.experienceLevel when field is added to schema */}
        </div>
      </div>
    </section>
  );
};
