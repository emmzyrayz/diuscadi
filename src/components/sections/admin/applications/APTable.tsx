"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuCircleCheck,
  LuCircleX,
  LuEllipsis,
  LuEye,
  LuShieldCheck,
  LuCode,
  LuCalendar,
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
import { Portal } from "@/components/ui/Portal";
import { APDetailModal } from "./modal/APDetailModal";
import { APRejectModal } from "./modal/APRejectModal";
import type { AdminApplication } from "@/app/admin/applications/page";

interface Props {
  applications: AdminApplication[];
  onAction: (id: string, action: "approve" | "reject", note?: string) => void;
}

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  {
    bg: string;
    color: string;
    icon: React.ElementType;
    label: string;
  }
> = {
  membership: {
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    icon: LuUserCheck,
    label: "Membership",
  },
  committee: {
    bg: "bg-blue-50",
    color: "text-blue-600",
    icon: LuShieldCheck,
    label: "Committee",
  },
  skills: {
    bg: "bg-purple-50",
    color: "text-purple-600",
    icon: LuCode,
    label: "Skills",
  },
  sponsorship: {
    bg: "bg-amber-50",
    color: "text-amber-600",
    icon: LuHandCoins,
    label: "Sponsorship",
  },
  program: {
    bg: "bg-sky-50",
    color: "text-sky-600",
    icon: LuGraduationCap,
    label: "Program",
  },
  writer: {
    bg: "bg-rose-50",
    color: "text-rose-600",
    icon: LuPenLine,
    label: "Writer",
  },
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
  rejected: "bg-rose-50 text-rose-600 border-rose-100",
};

// ── Request summary — one-liner per type ──────────────────────────────────────

function RequestSummary({ app }: { app: AdminApplication }) {
  if (app.type === "membership") {
    return (
      <span className="text-[11px] font-black text-foreground uppercase tracking-wide">
        Membership Upgrade
      </span>
    );
  }
  if (app.type === "committee") {
    return (
      <span className="text-[11px] font-black text-foreground uppercase tracking-wide">
        {app.requestedCommittee ?? "—"}
      </span>
    );
  }
  if (app.type === "skills") {
    return (
      <div className="flex flex-wrap gap-1">
        {(app.requestedSkills ?? []).slice(0, 3).map((s) => (
          <span
            key={s}
            className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[8px] font-black uppercase tracking-widest"
          >
            {s}
          </span>
        ))}
        {(app.requestedSkills?.length ?? 0) > 3 && (
          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-[8px] font-black">
            +{(app.requestedSkills?.length ?? 0) - 3}
          </span>
        )}
      </div>
    );
  }
  if (app.type === "sponsorship") {
    const d = app.sponsorshipDetails as Record<string, unknown> | null;
    return (
      <span className="text-[11px] font-black text-foreground uppercase tracking-wide">
        {(d?.companyName as string) ?? "Sponsorship Offer"}
      </span>
    );
  }
  if (app.type === "program") {
    return (
      <span className="text-[11px] font-black text-foreground uppercase tracking-wide">
        {app.requestedProgram ?? "—"}
      </span>
    );
  }
  if (app.type === "writer") {
    return (
      <span className="text-[11px] font-black text-foreground uppercase tracking-wide">
        Blog Contributor
      </span>
    );
  }
  return <span className="text-[11px] text-muted-foreground">—</span>;
}

// ── Table ─────────────────────────────────────────────────────────────────────

export const APTable: React.FC<Props> = ({ applications, onAction }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="w-full bg-background px-4 py-2 border-2 border-border rounded-[2.5rem] shadow-sm"
  >
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[360px]">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {[
              { label: "Applicant", cls: "" },
              { label: "Type", cls: "hidden md:table-cell" },
              { label: "Request", cls: "hidden lg:table-cell" },
              { label: "Submitted", cls: "hidden lg:table-cell" },
              { label: "Status", cls: "" },
              { label: "Actions", cls: "text-right" },
            ].map(({ label, cls }) => (
              <th
                key={label}
                className={cn(
                  "px-3 md:px-4 lg:px-6 py-3 lg:py-5 text-[9px] lg:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                  cls,
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {applications.map((app, index) => (
            <APRow
              key={app.id}
              app={app}
              onAction={onAction}
              delay={0.1 + index * 0.03}
            />
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

// ── Row ───────────────────────────────────────────────────────────────────────

const APRow: React.FC<{
  app: AdminApplication;
  onAction: (id: string, action: "approve" | "reject", note?: string) => void;
  delay?: number;
}> = ({ app, onAction, delay = 0 }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const isPending = app.status === "pending";
  const fullName = app.user?.fullName
    ? resolveAdminFullName(app.user.fullName as never)
    : "Unknown User";
  const initial = app.user?.fullName
    ? resolveAdminInitial(app.user.fullName as never)
    : "?";
  const avatarSrc = app.user?.avatar ?? null;
  const typeConfig = TYPE_CONFIG[app.type] ?? TYPE_CONFIG.committee;
  const TypeIcon = typeConfig.icon;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay }}
        className="group transition-all hover:bg-muted/50"
      >
        {/* Applicant */}
        <td className="px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-5">
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
            <div
              className={cn(
                "shrink-0 rounded-full bg-muted overflow-hidden border border-border flex items-center justify-center font-black text-muted-foreground",
                "w-7 h-7 text-[10px] md:w-9 md:h-9 md:text-xs lg:w-10 lg:h-10 lg:text-sm",
              )}
            >
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={fullName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] md:text-xs lg:text-sm font-black tracking-tight truncate text-foreground group-hover:text-primary transition-colors">
                {fullName}
              </span>
              <span className="hidden sm:block text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate">
                {app.user?.email ?? "—"}
              </span>
            </div>
          </div>
        </td>

        {/* Type */}
        <td className="hidden md:table-cell px-4 lg:px-6 py-3 lg:py-5">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                typeConfig.bg,
              )}
            >
              <TypeIcon className={cn("w-3.5 h-3.5", typeConfig.color)} />
            </div>
            <span
              className={cn(
                "text-[10px] lg:text-[11px] font-black uppercase tracking-wider",
                typeConfig.color,
              )}
            >
              {typeConfig.label}
            </span>
          </div>
        </td>

        {/* Request */}
        <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-5">
          <RequestSummary app={app} />
        </td>

        {/* Submitted */}
        <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <LuCalendar className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              {new Date(app.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </td>

        {/* Status */}
        <td className="px-2 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-5">
          <span
            className={cn(
              "rounded-full border font-black uppercase inline-flex items-center gap-1 md:gap-1.5",
              "px-1.5 py-0.5 text-[7px] tracking-[0.1em] md:px-2.5 md:py-1 md:text-[8px] md:tracking-widest",
              STATUS_STYLES[app.status] ??
                "bg-muted text-muted-foreground border-slate-200",
            )}
          >
            <div
              className={cn(
                "rounded-full shrink-0 w-1 h-1 md:w-1.5 md:h-1.5",
                app.status === "pending"
                  ? "bg-amber-500"
                  : app.status === "approved"
                    ? "bg-emerald-500"
                    : "bg-rose-500",
              )}
            />
            {app.status}
          </span>
        </td>

        {/* Actions */}
        <td className="pr-2 md:pr-5 lg:pr-8 pl-1 md:pl-2 py-2.5 md:py-3 lg:py-5 text-right relative">
          {isPending && (
            <div className="hidden md:inline-flex items-center gap-1.5 mr-1">
              <button
                onClick={() => onAction(app.id, "approve")}
                title="Approve"
                className="p-1.5 lg:p-2 bg-emerald-500 text-background rounded-lg lg:rounded-xl hover:bg-emerald-600 transition-all shadow-md cursor-pointer"
              >
                <LuCircleCheck className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
              <button
                onClick={() => setShowReject(true)}
                title="Reject"
                className="p-1.5 lg:p-2 bg-rose-500 text-background rounded-lg lg:rounded-xl hover:bg-rose-600 transition-all shadow-md cursor-pointer"
              >
                <LuCircleX className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 md:p-2 hover:bg-background border border-transparent hover:border-border rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <LuEllipsis className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute right-1 md:right-5 lg:right-8 top-10 md:top-12 w-44 md:w-48 bg-background border border-border rounded-2xl shadow-2xl z-20 p-1.5 md:p-2"
                >
                  <MenuItem
                    icon={LuEye}
                    label="View Details"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDetail(true);
                    }}
                  />
                  {isPending && (
                    <>
                      <div className="h-px bg-muted my-1" />
                      <MenuItem
                        icon={LuCircleCheck}
                        label="Approve"
                        color="text-emerald-600"
                        onClick={() => {
                          setShowMenu(false);
                          onAction(app.id, "approve");
                        }}
                      />
                      <MenuItem
                        icon={LuCircleX}
                        label="Reject"
                        color="text-rose-600"
                        onClick={() => {
                          setShowMenu(false);
                          setShowReject(true);
                        }}
                      />
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </td>
      </motion.tr>

      <Portal>
        <APDetailModal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          app={app}
          onApprove={() => {
            setShowDetail(false);
            onAction(app.id, "approve");
          }}
          onReject={() => {
            setShowDetail(false);
            setShowReject(true);
          }}
        />
      </Portal>
      <Portal>
        <APRejectModal
          isOpen={showReject}
          onClose={() => setShowReject(false)}
          applicantName={fullName}
          onConfirm={(note) => {
            setShowReject(false);
            onAction(app.id, "reject", note);
          }}
        />
      </Portal>
    </>
  );
};

const MenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  color?: string;
  onClick: () => void;
}> = ({ icon: Icon, label, color = "text-slate-600", onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2.5 px-2.5 md:px-3 py-2 md:py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer",
      color,
    )}
  >
    <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tight">
      {label}
    </span>
  </button>
);
