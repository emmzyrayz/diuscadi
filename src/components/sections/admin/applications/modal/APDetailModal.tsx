"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCircleCheck,
  LuCircleX,
  LuShieldCheck,
  LuCode,
  LuCalendar,
  LuUser,
  LuFileText,
  LuUserCheck,
  LuHandCoins,
  LuGraduationCap,
  LuPenLine,
} from "react-icons/lu";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  resolveAdminFullName,
  resolveAdminInitial,
} from "@/utils/adminFullName";
import type { AdminApplication } from "@/app/admin/applications/page";
import { ApplicationType } from "@/context/ApplicationContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  app: AdminApplication;
  onApprove: () => void;
  onReject: () => void;
}

export const APDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  app,
  onApprove,
  onReject,
}) => {
  const isPending = app.status === "pending";
  const fullName = app.user?.fullName
    ? resolveAdminFullName(app.user.fullName as never)
    : "Unknown User";
  const initial = app.user?.fullName
    ? resolveAdminInitial(app.user.fullName as never)
    : "?";
  const avatarSrc = app.user?.avatar ?? null;

  const TYPE_CONFIG: Record<
    ApplicationType,
    { Icon: React.ElementType; color: string; bg: string }
  > = {
    membership: {
      Icon: LuUserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    committee: {
      Icon: LuShieldCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    skills: { Icon: LuCode, color: "text-purple-600", bg: "bg-purple-50" },
    sponsorship: {
      Icon: LuHandCoins,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    program: { Icon: LuGraduationCap, color: "text-sky-600", bg: "bg-sky-50" },
    writer: { Icon: LuPenLine, color: "text-rose-600", bg: "bg-rose-50" },
  };
  const typeCfg = TYPE_CONFIG[app.type] ?? TYPE_CONFIG.committee;
  const { Icon } = typeCfg;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-[200]",
            "flex",
            "items-center",
            "justify-center",
            "p-4",
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn(
              "absolute",
              "inset-0",
              "bg-foreground/60",
              "backdrop-blur-sm",
            )}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative",
              "w-full",
              "max-w-lg",
              "bg-background",
              "rounded-[2.5rem]",
              "shadow-2xl",
              "overflow-hidden",
            )}
          >
            <button
              onClick={onClose}
              className={cn(
                "absolute",
                "top-6",
                "right-6",
                "p-2",
                "text-slate-300",
                "hover:text-foreground",
                "transition-colors",
                "cursor-pointer",
              )}
            >
              <LuX className={cn("w-5", "h-5")} />
            </button>

            <div className={cn("p-8", "space-y-6")}>
              {/* Type header */}
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl",
                  typeCfg.bg,
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl bg-background flex items-center justify-center",
                  )}
                >
                  <Icon className={cn("w-5 h-5", typeCfg.color)} />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      typeCfg.color,
                    )}
                  >
                    {app.type} Application
                  </p>
                  <p
                    className={cn(
                      "text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5",
                    )}
                  >
                    {new Date(app.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Applicant */}
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5",
                  )}
                >
                  <LuUser className={cn("w-3", "h-3")} /> Applicant
                </p>
                <div
                  className={cn(
                    "flex items-center gap-4 p-4 bg-muted rounded-2xl border border-border",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-background shadow-sm flex items-center justify-center font-black text-muted-foreground",
                    )}
                  >
                    {avatarSrc ? (
                      <Image
                        src={avatarSrc}
                        alt={fullName}
                        width={48}
                        height={48}
                        className={cn("w-full", "h-full", "object-cover")}
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div>
                    <p className={cn("text-sm font-black text-foreground")}>
                      {fullName}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-bold text-muted-foreground",
                      )}
                    >
                      {app.user?.email ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Icon className="w-3 h-3" /> Request Details
                </p>
                <div className="p-4 bg-muted rounded-2xl border border-border">
                  {app.type === "committee" && (
                    <p className="text-sm font-black text-foreground uppercase tracking-wide">
                      {app.requestedCommittee ?? "—"}
                    </p>
                  )}
                  {app.type === "skills" && (
                    <div className="flex flex-wrap gap-2">
                      {(app.requestedSkills ?? []).map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl text-[9px] font-black uppercase tracking-widest"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {app.type === "program" && (
                    <p className="text-sm font-black text-foreground uppercase tracking-wide">
                      {app.requestedProgram ?? "—"}
                    </p>
                  )}
                  {app.type === "sponsorship" && (
                    <p className="text-sm font-black text-foreground uppercase tracking-wide">
                      {(app.sponsorshipDetails?.companyName as string) ??
                        "Sponsorship Offer"}
                    </p>
                  )}
                  {app.type === "writer" && (
                    <p className="text-sm font-black text-foreground uppercase tracking-wide">
                      Blog Contributor
                    </p>
                  )}
                  {app.type === "membership" && (
                    <p className="text-sm font-black text-foreground uppercase tracking-wide">
                      Membership Upgrade
                    </p>
                  )}
                </div>
              </div>

              {/* Reason */}
              {app.reason && (
                <div className="space-y-2">
                  <p
                    className={cn(
                      "text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5",
                    )}
                  >
                    <LuFileText className={cn("w-3", "h-3")} /> Reason
                  </p>
                  <div
                    className={cn(
                      "p-4 bg-muted rounded-2xl border border-border",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium text-foreground leading-relaxed",
                      )}
                    >
                      {app.reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Review note if already reviewed */}
              {app.reviewNote && (
                <div
                  className={cn(
                    "p-4 rounded-2xl border",
                    app.status === "approved"
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-rose-50 border-rose-100",
                  )}
                >
                  <p
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest mb-1",
                      app.status === "approved"
                        ? "text-emerald-600"
                        : "text-rose-600",
                    )}
                  >
                    Review Note
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      app.status === "approved"
                        ? "text-emerald-800"
                        : "text-rose-800",
                    )}
                  >
                    {app.reviewNote}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {isPending && (
              <div
                className={cn("flex", "items-center", "gap-3", "p-8", "pt-0")}
              >
                <button
                  onClick={onReject}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-rose-500 text-background hover:bg-rose-600 transition-all shadow-xl cursor-pointer",
                  )}
                >
                  <LuCircleX className={cn("w-4", "h-4")} /> Reject
                </button>
                <button
                  onClick={onApprove}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-background hover:bg-emerald-600 transition-all shadow-xl cursor-pointer",
                  )}
                >
                  <LuCircleCheck className={cn("w-4", "h-4")} /> Approve
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
