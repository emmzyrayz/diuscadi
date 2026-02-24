"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuShieldCheck,
  LuLogOut,
  LuCircleUser,
  LuQrCode,
  LuExternalLink,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  status: "Student" | "Professional" | "Premium" | "Free";
  inviteCode?: string;
}

interface VerificationCardProps {
  user: UserProfile;
  onSwitchAccount?: () => void;
}

export const TicketUserVerificationCard = ({
  user,
  onSwitchAccount,
}: VerificationCardProps) => {
  return (
    <section className={cn("w-full", "max-w-4xl", "mx-auto", "px-4", "py-8")}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white",
          "border-2",
          "border-slate-900",
          "rounded-[2.5rem]",
          "overflow-hidden",
          "shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]",
        )}
      >
        <div className={cn("flex", "flex-col", "md:flex-row")}>
          {/* Left Side: User Identity */}
          <div
            className={cn(
              "flex-1",
              "p-8",
              "md:p-10",
              "border-b",
              "md:border-b-0",
              "md:border-r",
              "border-slate-100",
            )}
          >
            <div className={cn("flex", "items-center", "gap-2", "mb-8")}>
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "justify-center",
                  "w-6",
                  "h-6",
                  "bg-emerald-100",
                  "text-emerald-600",
                  "rounded-full",
                )}
              >
                <LuShieldCheck className={cn("w-4", "h-4")} />
              </div>
              <span
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-[0.2em]",
                  "text-slate-400",
                )}
              >
                Identity Verified
              </span>
            </div>

            <div className={cn("flex", "items-center", "gap-6")}>
              {/* Profile Photo */}
              <div className={cn("relative", "group")}>
                <div
                  className={cn(
                    "w-20",
                    "h-20",
                    "md:w-24",
                    "md:h-24",
                    "rounded-3xl",
                    "overflow-hidden",
                    "bg-slate-100",
                    "border-4",
                    "border-white",
                    "shadow-lg",
                    "shadow-slate-200",
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
                    <LuCircleUser
                      className={cn(
                        "w-full",
                        "h-full",
                        "text-slate-300",
                        "p-2",
                      )}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    "absolute",
                    "-bottom-2",
                    "-right-2",
                    "bg-primary",
                    "text-white",
                    "p-1.5",
                    "rounded-xl",
                    "shadow-lg",
                    "border-2",
                    "border-white",
                  )}
                >
                  <LuShieldCheck className={cn("w-4", "h-4")} />
                </div>
              </div>

              {/* Identity Details */}
              <div className="space-y-1">
                <h3
                  className={cn(
                    "text-xl",
                    "md:text-2xl",
                    "font-black",
                    "text-slate-900",
                    "leading-none",
                  )}
                >
                  {user.name}
                </h3>
                <p className={cn("text-sm", "font-bold", "text-slate-500")}>
                  {user.email}
                </p>

                <div className={cn("pt-2", "flex", "flex-wrap", "gap-2")}>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      user.status === "Premium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {user.status} Member
                  </span>

                  {user.inviteCode && (
                    <div
                      className={cn(
                        "flex",
                        "items-center",
                        "gap-1.5",
                        "px-3",
                        "py-1",
                        "bg-primary/10",
                        "text-primary",
                        "rounded-lg",
                        "text-[9px]",
                        "font-black",
                        "uppercase",
                        "tracking-widest",
                        "border",
                        "border-primary/20",
                      )}
                    >
                      <LuQrCode className={cn("w-3", "h-3")} />
                      Code: {user.inviteCode}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Account Actions */}
          <div
            className={cn(
              "w-full",
              "md:w-64",
              "bg-slate-50",
              "p-8",
              "flex",
              "flex-col",
              "justify-between",
              "gap-6",
            )}
          >
            <div className="space-y-4">
              <p
                className={cn(
                  "text-[10px]",
                  "font-black",
                  "text-slate-400",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Wrong Identity?
              </p>
              <button
                onClick={onSwitchAccount}
                className={cn(
                  "w-full",
                  "flex",
                  "items-center",
                  "justify-between",
                  "px-4",
                  "py-3",
                  "bg-white",
                  "border",
                  "border-slate-200",
                  "rounded-xl",
                  "text-xs",
                  "font-bold",
                  "text-slate-900",
                  "hover:border-primary",
                  "hover:text-primary",
                  "transition-all",
                  "group",
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
              className={cn(
                "flex",
                "items-center",
                "gap-2",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-slate-400",
                "hover:text-primary",
                "transition-colors",
              )}
            >
              Edit Profile Info
              <LuExternalLink className={cn("w-3", "h-3")} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Helping Note */}
      <p
        className={cn(
          "mt-6",
          "text-center",
          "text-xs",
          "text-slate-400",
          "font-medium",
        )}
      >
        This ticket will be electronically linked to your{" "}
        <strong className="text-slate-900">DIUSCADI ID</strong>. Ensure your
        name matches your valid government-issued ID.
      </p>
    </section>
  );
};
