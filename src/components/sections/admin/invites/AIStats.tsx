"use client";
// sections/admin/invites/AIStats.tsx

import React from "react";
import { IconType } from "react-icons";
import {
  LuTicket,
  LuCircleCheck,
  LuClock,
//   LuCircleX,
  LuBan,
} from "react-icons/lu";
import { cn } from "../../../../lib/utils";

interface InviteStats {
  total: number;
  active: number;
  used: number;
  expired: number;
  revoked: number;
}

interface Props {
  stats: InviteStats | null;
}

export const AdminInvitesStats: React.FC<Props> = ({ stats }) => {
  const usageRate =
    stats && stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0;

  return (
    <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-4', 'gap-6')}>
      <StatCard
        label="Total Generated"
        value={stats?.total.toLocaleString() ?? "—"}
        icon={LuTicket}
        color="text-foreground"
        bg="bg-muted"
        description="All codes ever created"
      />
      <StatCard
        label="Active"
        value={stats?.active.toLocaleString() ?? "—"}
        icon={LuClock}
        color="text-blue-600"
        bg="bg-blue-50"
        description="Valid and available to use"
      />
      <StatCard
        label="Used"
        value={stats?.used.toLocaleString() ?? "—"}
        icon={LuCircleCheck}
        color="text-emerald-600"
        bg="bg-emerald-50"
        description={`${usageRate}% redemption rate`}
        showProgress={usageRate}
      />
      <StatCard
        label="Expired / Revoked"
        value={((stats?.expired ?? 0) + (stats?.revoked ?? 0)).toLocaleString()}
        icon={LuBan}
        color="text-rose-600"
        bg="bg-rose-50"
        description="Inactive or manually revoked"
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: IconType;
  color: string;
  bg: string;
  description: string;
  showProgress?: number;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  bg,
  description,
  showProgress,
}: StatCardProps) => (
  <div className={cn('p-8', 'rounded-[2.5rem]', 'border', 'border-border', 'bg-background', 'shadow-sm', 'hover:shadow-md', 'transition-all', 'group')}>
    <div className={cn('flex', 'justify-between', 'items-start', 'mb-6')}>
      <div
        className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className={cn('w-7', 'h-7')} />
      </div>
      {showProgress !== undefined && showProgress > 0 && (
        <div className={cn('flex', 'flex-col', 'items-end')}>
          <span className={cn('text-[10px]', 'font-black', 'text-emerald-600', 'uppercase', 'tracking-widest')}>
            {showProgress}%
          </span>
          <div className={cn('w-16', 'h-1', 'bg-muted', 'rounded-full', 'mt-1', 'overflow-hidden')}>
            <div
              className={cn('h-full', 'bg-emerald-500')}
              style={{ width: `${showProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
    <div>
      <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-[0.2em]', 'mb-1')}>
        {label}
      </p>
      <h3 className={`text-3xl font-black ${color} tracking-tighter`}>
        {value}
      </h3>
      <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-3', 'leading-relaxed')}>
        {description}
      </p>
    </div>
  </div>
);
