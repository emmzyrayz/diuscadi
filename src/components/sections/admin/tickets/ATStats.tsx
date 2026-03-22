"use client";
import React from "react";
import { IconType } from "react-icons";
import { LuTicket, LuCircleCheck, LuCircleX, LuClock } from "react-icons/lu";

interface TicketStats {
  total: number;
  active: number;
  checkedIn: number;
  invalidated: number;
}

interface Props {
  stats: TicketStats | null;
}

export const AdminTicketsStats: React.FC<Props> = ({ stats }) => {
  const attendanceRate =
    stats && stats.total > 0
      ? Math.round((stats.checkedIn / stats.total) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
      <StatCard
        label="Total Issued"
        value={stats ? stats.total.toLocaleString() : "—"}
        icon={LuTicket}
        color="text-foreground"
        bg="bg-muted"
        description="Total tickets generated across all events"
      />
      <StatCard
        label="Active / Unused"
        value={stats ? stats.active.toLocaleString() : "—"}
        icon={LuClock}
        color="text-blue-600"
        bg="bg-blue-50"
        description="Valid passes awaiting check-in"
      />
      <StatCard
        label="Checked-In"
        value={stats ? stats.checkedIn.toLocaleString() : "—"}
        icon={LuCircleCheck}
        color="text-emerald-600"
        bg="bg-emerald-50"
        description={`${attendanceRate}% attendance rate`}
        showProgress={attendanceRate}
      />
      <StatCard
        label="Invalidated"
        value={stats ? stats.invalidated.toLocaleString() : "—"}
        icon={LuCircleX}
        color="text-rose-600"
        bg="bg-rose-50"
        description="Revoked or cancelled credentials"
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
  <div className="p-8 rounded-[2.5rem] border border-border bg-background shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-6">
      <div
        className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-7 h-7" />
      </div>
      {showProgress !== undefined && showProgress > 0 && (
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            {showProgress}%
          </span>
          <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${showProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
    <div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">
        {label}
      </p>
      <h3 className={`text-3xl font-black ${color} tracking-tighter`}>
        {value}
      </h3>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-3 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);
