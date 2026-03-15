"use client";
import React from "react";
import {
  LuCalendarDays,
  LuFingerprint,
  LuShieldCheck,
  LuTicket,
  LuBadgeCheck,
  LuShieldAlert,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import type { UserProfile } from "@/context/UserContext";

interface MembershipInfoSectionProps {
  profile: UserProfile;
}

export const MembershipInfoSection = ({
  profile,
}: MembershipInfoSectionProps) => {
  // Format join date from ISO string
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      })
    : "—";

  // Shorten the user id for display as membership ID
  const membershipId = profile.id
    ? `DIU-${profile.id.slice(-6).toUpperCase()}`
    : "—";

  const statusMap: Record<
    string,
    { label: string; classes: string; icon: IconType }
  > = {
    approved: {
      label: "Verified",
      classes: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      icon: LuShieldCheck,
    },
    pending: {
      label: "Pending",
      classes: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: LuShieldAlert,
    },
    suspended: {
      label: "Suspended",
      classes: "bg-destructive/10 text-destructive border-destructive/20",
      icon: LuShieldAlert,
    },
  };

  const statusInfo = statusMap[profile.membershipStatus] ?? statusMap.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <section className={cn('glass', 'rounded-[2.5rem]', 'p-8', 'md:p-10', 'relative', 'overflow-hidden')}>
      {/* Header */}
      <div className={cn('flex', 'items-center', 'gap-3', 'mb-10')}>
        <div className={cn('w-10', 'h-10', 'rounded-xl', 'bg-muted', 'flex', 'items-center', 'justify-center', 'text-primary', 'border', 'border-border')}>
          <LuBadgeCheck className={cn('w-5', 'h-5')} />
        </div>
        <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'tracking-tight')}>
          System Membership
        </h3>
      </div>

      {/* Stats grid */}
      <div className={cn('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4', 'gap-8')}>
        <MemberStat
          icon={LuCalendarDays}
          label="Member Since"
          value={memberSince}
        />

        <MemberStat
          icon={LuFingerprint}
          label="Membership ID"
          value={membershipId}
          isMono
        />

        {/* Verification status */}
        <div className="space-y-3">
          <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'leading-none')}>
            Trust Status
          </p>
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border",
              "text-[10px] font-black uppercase tracking-widest",
              statusInfo.classes,
            )}
          >
            <StatusIcon className={cn('w-3.5', 'h-3.5')} />
            {statusInfo.label}
          </div>
        </div>

        <MemberStat
          icon={LuTicket}
          label="Events Attended"
          value={`${profile.analytics.eventsAttended} Events`}
          highlight
        />
      </div>

      {/* Background icon */}
      <LuShieldCheck className={cn('absolute', '-right-4', '-bottom-4', 'w-32', 'h-32', 'text-muted-foreground/5', 'pointer-events-none')} />
    </section>
  );
};

interface MemberStatProps {
  icon: IconType;
  label: string;
  value: string;
  isMono?: boolean;
  highlight?: boolean;
}

const MemberStat = ({
  icon: Icon,
  label,
  value,
  isMono,
  highlight,
}: MemberStatProps) => (
  <div className={cn('space-y-3', 'group')}>
    <p className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'leading-none')}>
      {label}
    </p>
    <div className={cn('flex', 'items-center', 'gap-3')}>
      <div
        className={cn(
          "w-8 h-8 rounded-lg bg-muted flex items-center justify-center",
          "border border-border group-hover:border-primary/20 transition-colors",
        )}
      >
        <Icon className={cn('w-4', 'h-4', 'text-muted-foreground', 'group-hover:text-primary', 'transition-colors')} />
      </div>
      <p
        className={cn(
          "text-sm font-bold leading-none",
          isMono && "font-mono tracking-wider text-muted-foreground",
          highlight && "text-primary",
          !isMono && !highlight && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  </div>
);
