"use client";
import React from "react";
import { IconType } from "react-icons";
import { LuInbox, LuCircleCheck, LuCircleX, LuLayers } from "react-icons/lu";

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}
interface Props {
  stats: Stats | null;
}

export const APStats: React.FC<Props> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
    <StatCard
      label="Total"
      value={stats?.total.toLocaleString() ?? "—"}
      icon={LuLayers}
      color="text-foreground"
      bg="bg-muted"
      description="All applications ever submitted"
    />
    <StatCard
      label="Pending"
      value={stats?.pending.toLocaleString() ?? "—"}
      icon={LuInbox}
      color="text-amber-600"
      bg="bg-amber-50"
      description="Awaiting review"
    />
    <StatCard
      label="Approved"
      value={stats?.approved.toLocaleString() ?? "—"}
      icon={LuCircleCheck}
      color="text-emerald-600"
      bg="bg-emerald-50"
      description="Accepted applications"
    />
    <StatCard
      label="Rejected"
      value={stats?.rejected.toLocaleString() ?? "—"}
      icon={LuCircleX}
      color="text-rose-600"
      bg="bg-rose-50"
      description="Declined applications"
    />
  </div>
);

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  bg,
  description,
}: {
  label: string;
  value: string;
  icon: IconType;
  color: string;
  bg: string;
  description: string;
}) => (
  <div className="p-8 rounded-[2.5rem] border border-border bg-background shadow-sm hover:shadow-md transition-all group">
    <div className="mb-6">
      <div
        className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-7 h-7" />
      </div>
    </div>
    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">
      {label}
    </p>
    <h3 className={`text-3xl font-black ${color} tracking-tighter`}>{value}</h3>
    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
      {description}
    </p>
  </div>
);
