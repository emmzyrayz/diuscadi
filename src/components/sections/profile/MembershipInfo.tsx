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

// 1. Define Strict TypeScript Interfaces
export type VerificationStatus = "Verified" | "Pending" | "Unverified";

export interface MembershipData {
  memberSince: string;
  membershipId: string;
  verificationStatus: VerificationStatus;
  totalEventsAttended: number;
}

interface MembershipInfoProps {
  data: MembershipData;
}

export const MembershipInfoSection = ({ data }: MembershipInfoProps) => {
  return (
    <section className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary border border-slate-100">
          <LuBadgeCheck className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          System Membership
        </h3>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Member Since */}
        <MemberStat
          icon={LuCalendarDays}
          label="Member Since"
          value={data.memberSince}
        />

        {/* Membership ID */}
        <MemberStat
          icon={LuFingerprint}
          label="Membership ID"
          value={data.membershipId}
          isMono
        />

        {/* Verification Status */}
        <div className="space-y-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
            Trust Status
          </p>
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest",
              data.verificationStatus === "Verified"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : data.verificationStatus === "Pending"
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : "bg-rose-50 text-rose-600 border-rose-100",
            )}
          >
            {data.verificationStatus === "Verified" ? (
              <LuShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <LuShieldAlert className="w-3.5 h-3.5" />
            )}
            {data.verificationStatus}
          </div>
        </div>

        {/* Total Events Attended */}
        <MemberStat
          icon={LuTicket}
          label="Total Attendance"
          value={`${data.totalEventsAttended} Events`}
          highlight
        />
      </div>

      {/* Trust Seal Background */}
      <LuShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50/50 pointer-events-none" />
    </section>
  );
};

// 2. Internal Helper Component with Typed Props
interface MemberStatProps {
  icon: React.ElementType;
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
  <div className="space-y-3 group">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
      {label}
    </p>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
        <Icon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
      </div>
      <p
        className={cn(
          "text-sm font-bold leading-none",
          isMono ? "font-mono tracking-wider text-slate-500" : "text-slate-700",
          highlight && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  </div>
);
