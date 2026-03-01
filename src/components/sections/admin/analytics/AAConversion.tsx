"use client";
import React from "react";
import { IconType } from "react-icons";
import {
  LuFilter,
  LuMousePointerClick,
  LuUserCheck,
  LuCircleAlert,
  LuArrowDownRight,
  LuTarget,
} from "react-icons/lu";

// --- Interfaces ---

interface FunnelStepProps {
  label: string;
  value: string;
  percent: number;
  color: string;
}

interface DropoffItemProps {
  stage: string;
  rate: string;
  desc: string;
}

interface ConversionStatProps {
  icon: IconType;
  label: string;
  value: string;
  status: string;
}

// --- Main Component ---

export const AdminAnalyticsConversionSection: React.FC = () => {
  return (
    <div className="space-y-8 mb-16">
      {/* 1. Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-slate-900 rounded-xl border border-primary/20">
            <LuTarget className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              Growth Optimization
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Funnel performance & conversion bottlenecks
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 2. RegistrationConversionChart (The Funnel) */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
          <div className="relative z-10 space-y-1 mb-10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Acquisition Funnel
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Visitor to Registered User conversion
            </p>
          </div>

          <div className="space-y-4 relative z-10">
            <FunnelStep
              label="Event Page Views"
              value="12,400"
              percent={100}
              color="bg-slate-900"
            />
            <div className="flex justify-center my-1 text-slate-300">
              <LuArrowDownRight className="w-4 h-4" />{" "}
              <span className="text-[8px] font-black ml-2">42% Drop-off</span>
            </div>

            <FunnelStep
              label="Clicked Register"
              value="7,200"
              percent={58}
              color="bg-slate-700"
            />
            <div className="flex justify-center my-1 text-slate-300">
              <LuArrowDownRight className="w-4 h-4" />{" "}
              <span className="text-[8px] font-black ml-2">15% Drop-off</span>
            </div>

            <FunnelStep
              label="Completed Ticket"
              value="6,120"
              percent={49}
              color="bg-primary"
            />
          </div>

          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* 3. DropoffAnalysisChart */}
        <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 flex flex-col">
          <div className="space-y-1 mb-8">
            <h3 className="text-sm font-black text-rose-900 uppercase tracking-tight flex items-center gap-2">
              <LuCircleAlert className="w-4 h-4" /> Critical Drop-offs
            </h3>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
              Where users are leaving
            </p>
          </div>

          <div className="flex-1 space-y-6">
            <DropoffItem
              stage="Email Verification"
              rate="18%"
              desc="Users failing to click the magic link in their inbox."
            />
            <DropoffItem
              stage="Invite Code Validation"
              rate="12%"
              desc="Users entering expired or invalid codes at checkout."
            />
            <DropoffItem
              stage="Profile Completion"
              rate="5%"
              desc="Drop-off during mandatory department/school selection."
            />
          </div>

          <button className="mt-8 w-full py-4 bg-white border border-rose-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-600 hover:text-white transition-all">
            Optimize Registration Flow
          </button>
        </div>
      </div>

      {/* 4. Conversion Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ConversionStat
          icon={LuMousePointerClick}
          label="Click-Through Rate (CTR)"
          value="8.4%"
          status="Above Average"
        />
        <ConversionStat
          icon={LuUserCheck}
          label="Total Conv. Rate"
          value="49.3%"
          status="Healthy"
        />
        <ConversionStat
          icon={LuFilter}
          label="Form Completion Time"
          value="1m 12s"
          status="Optimal"
        />
      </div>
    </div>
  );
};

// --- Helper Components ---

const FunnelStep: React.FC<FunnelStepProps> = ({
  label,
  value,
  percent,
  color,
}) => (
  <div className="group">
    <div className="flex justify-between items-end mb-2">
      <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
        {label}
      </span>
      <div className="text-right">
        <p className="text-xs font-black text-slate-900 leading-none">
          {value}
        </p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
          {percent}% of Total
        </p>
      </div>
    </div>
    <div className="h-10 w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
      <div
        className={`h-full ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

const DropoffItem: React.FC<DropoffItemProps> = ({ stage, rate, desc }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-rose-900 uppercase tracking-tight">
        {stage}
      </span>
      <span className="text-xs font-black text-rose-600">{rate}</span>
    </div>
    <p className="text-[9px] font-bold text-rose-400 uppercase leading-tight">
      {desc}
    </p>
  </div>
);

const ConversionStat: React.FC<ConversionStatProps> = ({
  icon: Icon,
  label,
  value,
  status,
}) => (
  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {label}
        </span>
      </div>
      <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
        {value}
      </h4>
    </div>
    <span className="text-[8px] font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 text-slate-500">
      {status}
    </span>
  </div>
);
