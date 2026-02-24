"use client";
import React from "react";
import { LuUserX, LuCamera } from "react-icons/lu";
import Link from "next/link";
import { cn } from "../../../../lib/utils";

export const CompleteProfilePrompt = () => {
  return (
    <div className={cn("max-w-xl", "mx-auto", "py-20", "px-4", "text-center")}>
      <div
        className={cn(
          "bg-orange-50",
          "border",
          "border-orange-200",
          "rounded-[2.5rem]",
          "p-10",
          "shadow-lg",
          "shadow-orange-100/50",
        )}
      >
        <div
          className={cn(
            "w-16",
            "h-16",
            "bg-white",
            "text-orange-500",
            "rounded-2xl",
            "flex",
            "items-center",
            "justify-center",
            "mx-auto",
            "mb-6",
            "shadow-sm",
          )}
        >
          <LuUserX className={cn("w-8", "h-8")} />
        </div>
        <h2 className={cn("text-2xl", "font-black", "text-slate-900", "mb-3")}>
          Incomplete Identity Profile
        </h2>
        <p
          className={cn(
            "text-slate-600",
            "font-medium",
            "mb-8",
            "text-sm",
            "leading-relaxed",
          )}
        >
          To prevent ticket fraud and ensure a smooth check-in process, all
          attendees must have a clear profile photo uploaded to their DIUSCADI
          account before registering.
        </p>
        <Link
          href="/settings/profile"
          className={cn(
            "inline-flex",
            "items-center",
            "gap-3",
            "px-8",
            "py-4",
            "bg-primary",
            "text-white",
            "font-black",
            "rounded-2xl",
            "hover:bg-orange-600",
            "transition-colors",
            "shadow-lg",
            "shadow-primary/25",
          )}
        >
          <LuCamera className={cn("w-5", "h-5")} />
          Upload Profile Photo
        </Link>
      </div>
    </div>
  );
};
