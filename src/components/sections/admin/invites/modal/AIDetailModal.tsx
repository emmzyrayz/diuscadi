"use client";
// sections/admin/invites/modal/AIDetailsModal.tsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCopy,
  LuCircleCheck,
  LuHash,
  LuCalendar,
  LuUsers,
  LuFileText,
  LuActivity,
  LuShieldCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import type { AdminInvite } from "@/app/admin/invites/page";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invite: AdminInvite;
}

export const AdminInviteDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  invite,
}) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usagePct =
    invite.maxUses > 0
      ? Math.round((invite.useCount / invite.maxUses) * 100)
      : 0;

  const STATUS_STYLES: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    used: "bg-slate-100 text-muted-foreground border-slate-200",
    expired: "bg-amber-50 text-amber-600 border-amber-100",
    revoked: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={cn('fixed', 'inset-0', 'z-[200]', 'flex', 'items-center', 'justify-center', 'p-4')}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn('absolute', 'inset-0', 'bg-foreground/60', 'backdrop-blur-sm')}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn('relative', 'w-full', 'max-w-md', 'bg-background', 'rounded-[2.5rem]', 'shadow-2xl', 'overflow-hidden')}
          >
            <button
              onClick={onClose}
              className={cn('absolute', 'top-6', 'right-6', 'p-2', 'text-slate-300', 'hover:text-foreground', 'transition-colors', 'cursor-pointer')}
            >
              <LuX className={cn('w-5', 'h-5')} />
            </button>

            <div className={cn('p-8', 'space-y-6')}>
              {/* Code display */}
              <div className={cn('flex', 'flex-col', 'items-center', 'text-center', 'gap-4', 'p-6', 'bg-muted', 'rounded-3xl')}>
                <div className={cn('w-14', 'h-14', 'rounded-2xl', 'bg-foreground', 'text-background', 'flex', 'items-center', 'justify-center')}>
                  <LuHash className={cn('w-7', 'h-7')} />
                </div>
                <div>
                  <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mb-1')}>
                    Invite Code
                  </p>
                  <h3 className={cn('text-3xl', 'font-black', 'text-foreground', 'font-mono', 'tracking-widest', 'uppercase')}>
                    {invite.code}
                  </h3>
                </div>
                <div className={cn('flex', 'gap-2')}>
                  <button
                    onClick={copy}
                    className={cn('flex', 'items-center', 'gap-2', 'px-4', 'py-2.5', 'bg-background', 'border', 'border-border', 'rounded-xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-tight', 'hover:border-foreground', 'transition-all', 'cursor-pointer')}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="c"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className={cn('flex', 'items-center', 'gap-1.5')}
                        >
                          <LuCircleCheck className={cn('w-3.5', 'h-3.5', 'text-emerald-500')} />{" "}
                          Copied
                        </motion.div>
                      ) : (
                        <motion.div
                          key="u"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className={cn('flex', 'items-center', 'gap-1.5')}
                        >
                          <LuCopy className={cn('w-3.5', 'h-3.5')} /> Copy
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  <span
                    className={cn(
                      "px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest",
                      STATUS_STYLES[invite.status],
                    )}
                  >
                    {invite.status}
                  </span>
                </div>
              </div>

              {/* Usage bar */}
              <div className="space-y-2">
                <div className={cn('flex', 'justify-between', 'items-center')}>
                  <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
                    Usage
                  </p>
                  <span
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      usagePct >= 100 ? "text-rose-500" : "text-emerald-600",
                    )}
                  >
                    {invite.useCount} / {invite.maxUses}
                  </span>
                </div>
                <div className={cn('w-full', 'h-2', 'bg-muted', 'rounded-full', 'overflow-hidden')}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(usagePct, 100)}%` }}
                    transition={{ duration: 1 }}
                    className={cn(
                      "h-full rounded-full",
                      usagePct >= 100 ? "bg-rose-500" : "bg-primary",
                    )}
                  />
                </div>
              </div>

              {/* Info grid */}
              <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
                <InfoBlock
                  icon={LuCalendar}
                  label="Created"
                  value={new Date(invite.createdAt).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  )}
                />
                <InfoBlock
                  icon={LuActivity}
                  label="Expires"
                  value={
                    invite.expiresAt
                      ? new Date(invite.expiresAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Never"
                  }
                />
                <InfoBlock
                  icon={LuUsers}
                  label="Max Uses"
                  value={String(invite.maxUses)}
                />
                <InfoBlock
                  icon={LuShieldCheck}
                  label="Use Count"
                  value={String(invite.useCount)}
                />
              </div>

              {invite.note && (
                <div className={cn('p-4', 'bg-muted', 'rounded-2xl', 'border', 'border-border', 'space-y-1')}>
                  <div className={cn('flex', 'items-center', 'gap-1.5', 'text-muted-foreground')}>
                    <LuFileText className={cn('w-3.5', 'h-3.5')} />
                    <p className={cn('text-[9px]', 'font-black', 'uppercase', 'tracking-widest')}>
                      Note
                    </p>
                  </div>
                  <p className={cn('text-xs', 'font-bold', 'text-foreground')}>
                    {invite.note}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const InfoBlock: React.FC<{ icon: IconType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className={cn('p-4', 'bg-muted', 'rounded-2xl', 'border', 'border-border', 'space-y-1.5')}>
    <div className={cn('flex', 'items-center', 'gap-1.5', 'text-muted-foreground')}>
      <Icon className={cn('w-3.5', 'h-3.5')} />
      <p className={cn('text-[9px]', 'font-black', 'uppercase', 'tracking-widest')}>{label}</p>
    </div>
    <p className={cn('text-sm', 'font-black', 'text-foreground')}>{value}</p>
  </div>
);
