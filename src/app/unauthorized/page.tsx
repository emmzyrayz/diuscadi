"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuShieldAlert, LuArrowLeft, LuLifeBuoy } from "react-icons/lu";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { cn } from "../../lib/utils";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;

  // Return destination depends on who is viewing
  const safeZone =
    role === "admin" || role === "webmaster"
      ? "/admin"
      : role === "moderator"
        ? "/admin/applications"
        : "/home";

  const safeLabel =
    role === "admin" || role === "webmaster"
      ? "Admin Dashboard"
      : role === "moderator"
        ? "Moderator Hub"
        : "Home";

  return (
    <div
      className={cn(
        "min-h-screen",
        "w-full",
        "bg-muted",
        "flex",
        "items-center",
        "justify-center",
        "p-6",
        "text-center",
      )}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "max-w-md",
          "w-full",
          "bg-background",
          "border",
          "border-border",
          "rounded-[3rem]",
          "p-12",
          "shadow-2xl",
          "shadow-slate-200/50",
        )}
      >
        {/* Icon */}
        <div className={cn("flex", "justify-center", "mb-8")}>
          <div
            className={cn(
              "w-24",
              "h-24",
              "bg-rose-50",
              "text-rose-500",
              "rounded-[2.5rem]",
              "flex",
              "items-center",
              "justify-center",
              "relative",
            )}
          >
            <LuShieldAlert className={cn("w-12", "h-12")} />
            <div
              className={cn(
                "absolute",
                "inset-0",
                "bg-rose-500/10",
                "blur-2xl",
                "rounded-full",
              )}
            />
          </div>
        </div>

        {/* Message */}
        <div className={cn("space-y-3", "mb-10")}>
          <h1
            className={cn(
              "text-3xl",
              "font-black",
              "text-foreground",
              "uppercase",
              "tracking-tighter",
            )}
          >
            Access Denied
          </h1>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-muted-foreground",
              "uppercase",
              "tracking-[0.2em]",
              "leading-relaxed",
            )}
          >
            Your current account level does not have permission to view this
            sector.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href={safeZone}
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "gap-3",
              "w-full",
              "py-5",
              "bg-foreground",
              "text-background",
              "rounded-2xl",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-[0.2em]",
              "hover:bg-primary",
              "hover:text-foreground",
              "transition-all",
              "shadow-xl",
              "shadow-foreground/10",
              "cursor-pointer",
            )}
          >
            <LuArrowLeft className={cn("w-4", "h-4")} /> Return to {safeLabel}
          </Link>

          {/* Only show for members who might legitimately need access */}
          {role === "participant" && (
            <Link
              href="/profile"
              className={cn(
                "flex",
                "items-center",
                "justify-center",
                "gap-2",
                "w-full",
                "py-4",
                "text-[9px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
                "hover:text-foreground",
                "transition-colors",
                "cursor-pointer",
              )}
            >
              <LuLifeBuoy className={cn("w-4", "h-4")} /> Request Elevated
              Access
            </Link>
          )}

          {/* Fallback back button for anyone else */}
          {role !== "participant" && (
            <button
              onClick={() => router.back()}
              className={cn(
                "flex",
                "items-center",
                "justify-center",
                "gap-2",
                "w-full",
                "py-4",
                "text-[9px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
                "hover:text-foreground",
                "transition-colors",
                "cursor-pointer",
              )}
            >
              <LuArrowLeft className={cn("w-4", "h-4")} /> Go Back
            </button>
          )}
        </div>

        {/* Footer */}
        <div className={cn("mt-12", "pt-8", "border-t", "border-slate-50")}>
          <p
            className={cn(
              "text-[8px]",
              "font-black",
              "text-slate-300",
              "uppercase",
              "tracking-widest",
            )}
          >
            Error Code: 403_FORBIDDEN_RESTRICTED_AREA
          </p>
        </div>
      </motion.div>
    </div>
  );
}
