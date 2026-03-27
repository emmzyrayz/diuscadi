"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuShieldCheck,
  LuLogOut,
  LuCircleUser,
  LuExternalLink,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { RegisterUserData } from "@/app/events/[slug]/register/page";

export const TicketUserVerificationCard = ({
  user,
}: {
  user: RegisterUserData;
}) => {
  const router = useRouter();
  const { logout } = useAuth();

  const roleBadge: Record<string, string> = {
    participant: "text-muted text-slate-600",
    moderator: "bg-blue-100 text-blue-700",
    admin: "bg-purple-100 text-purple-700",
    webmaster: "bg-amber-100 text-amber-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-background",
        "border-2",
        "border-foreground",
        "rounded-[2.5rem]",
        "overflow-hidden",
        "shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]",
      )}
    >
      <div className={cn("flex", "flex-col", "md:flex-row")}>
        {/* Identity */}
        <div
          className={cn(
            "flex-1",
            "p-8",
            "border-b",
            "md:border-b-0",
            "md:border-r",
            "border-border",
          )}
        >
          <div className={cn("flex", "items-center", "gap-2", "mb-6")}>
            <div
              className={cn(
                "w-5",
                "h-5",
                "bg-emerald-100",
                "text-emerald-600",
                "rounded-full",
                "flex",
                "items-center",
                "justify-center",
              )}
            >
              <LuShieldCheck className="w-3 h-3" />
            </div>
            <span
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-[0.2em]",
                "text-muted-foreground",
              )}
            >
              Identity Verified
            </span>
          </div>
          <div className={cn("flex", "items-center", "gap-5")}>
            <div className="relative">
              <div
                className={cn(
                  "w-20",
                  "h-20",
                  "rounded-3xl",
                  "overflow-hidden",
                  "text-muted",
                  "border-4",
                  "border-background",
                  "shadow-lg",
                )}
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={80}
                    height={80}
                    className={cn("w-full", "h-full", "object-cover")}
                  />
                ) : (
                  <LuCircleUser
                    className={cn("w-full", "h-full", "text-slate-300", "p-2")}
                  />
                )}
              </div>
              <div
                className={cn(
                  "absolute",
                  "-bottom-2",
                  "-right-2",
                  "bg-primary",
                  "text-background",
                  "p-1.5",
                  "rounded-xl",
                  "shadow-lg",
                  "border-2",
                  "border-background",
                )}
              >
                <LuShieldCheck className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h3
                className={cn(
                  "text-xl",
                  "font-black",
                  "text-foreground",
                  "leading-none",
                )}
              >
                {user.name}
              </h3>
              <p
                className={cn(
                  "text-sm",
                  "font-bold",
                  "text-muted-foreground",
                  "mt-1",
                )}
              >
                {user.email}
              </p>
              <span
                className={cn(
                  "inline-block mt-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest capitalize",
                  roleBadge[user.role] ?? "text-muted text-slate-600",
                )}
              >
                {user.role} Member
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className={cn(
            "w-full",
            "md:w-56",
            "bg-muted",
            "p-6",
            "flex",
            "flex-col",
            "justify-between",
            "gap-4",
          )}
        >
          <div className="space-y-3">
            <p
              className={cn(
                "text-[10px]",
                "font-black",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
              )}
            >
              Wrong Identity?
            </p>
            <button
              onClick={() => {
                logout();
                router.push("/auth");
              }}
              className={cn(
                "w-full",
                "flex",
                "items-center",
                "justify-between",
                "px-4",
                "py-3",
                "bg-background",
                "border",
                "border-border",
                "rounded-xl",
                "text-xs",
                "font-bold",
                "text-foreground",
                "hover:border-primary",
                "hover:text-primary",
                "transition-all",
                "group",
                "cursor-pointer",
              )}
            >
              Switch Account
              <LuLogOut
                className={cn(
                  "w-4",
                  "h-4",
                  "group-hover:translate-x-1",
                  "transition-transform",
                )}
              />
            </button>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-muted-foreground",
              "hover:text-primary",
              "transition-colors",
              "cursor-pointer",
            )}
          >
            Edit Profile Info <LuExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
