"use client";
import React from "react";
import { LuShieldAlert, LuLock, LuArrowRight } from "react-icons/lu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const AuthRequiredCard = ({ eventSlug }: { eventSlug?: string }) => {
  const pathname = usePathname();
  const returnTo = encodeURIComponent(pathname);

  return (
    <div className={cn("max-w-xl", "mx-auto", "py-20", "px-4", "text-center")}>
      <div
        className={cn(
          "bg-muted",
          "border",
          "border-border",
          "rounded-[2.5rem]",
          "p-10",
          "md:p-16",
          "shadow-xl",
          "shadow-slate-200/50",
        )}
      >
        <div
          className={cn(
            "w-20",
            "h-20",
            "bg-primary/10",
            "text-primary",
            "rounded-full",
            "flex",
            "items-center",
            "justify-center",
            "mx-auto",
            "mb-6",
          )}
        >
          <LuLock className={cn("w-10", "h-10")} />
        </div>
        <h2
          className={cn(
            "text-2xl",
            "md:text-3xl",
            "font-black",
            "text-foreground",
            "mb-4",
            "tracking-tight",
          )}
        >
          Authentication Required
        </h2>
        <p className={cn("text-muted-foreground", "font-medium", "mb-8")}>
          This event requires a verified DIUSCADI identity. Please sign in or
          create an official account to secure your access pass.
        </p>
        <div
          className={cn(
            "flex",
            "flex-col",
            "sm:flex-row",
            "gap-4",
            "justify-center",
          )}
        >
          <Link
            href={`/auth?return=${returnTo}`}
            className={cn(
              "px-8",
              "py-4",
              "bg-foreground",
              "text-background",
              "font-black",
              "rounded-2xl",
              "hover:bg-slate-800",
              "transition-colors",
              "shadow-lg",
              "shadow-foreground/20",
            )}
          >
            Sign In Securely
          </Link>
          <Link
            href={`/auth?mode=signup&return=${returnTo}`}
            className={cn(
              "px-8",
              "py-4",
              "bg-background",
              "text-primary",
              "border-2",
              "border-border",
              "hover:border-primary",
              "font-black",
              "rounded-2xl",
              "transition-all",
              "flex",
              "items-center",
              "justify-center",
              "gap-2",
              "group",
            )}
          >
            Create Account
            <LuArrowRight
              className={cn(
                "w-5",
                "h-5",
                "group-hover:translate-x-1",
                "transition-transform",
              )}
            />
          </Link>
        </div>
        <div
          className={cn(
            "mt-8",
            "flex",
            "items-center",
            "justify-center",
            "gap-2",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-[0.2em]",
            "text-muted-foreground",
          )}
        >
          <LuShieldAlert className={cn("w-4", "h-4")} /> End-to-End Encrypted
        </div>
      </div>
    </div>
  );
};
