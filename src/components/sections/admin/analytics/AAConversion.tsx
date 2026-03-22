"use client";
// AAConversion.tsx
//
// IMPORTANT: All numeric values in this component are PLACEHOLDER data.
// Funnel metrics (page views, click-through rate, form completion time)
// require client-side event tracking that is not yet implemented.
//
// What's needed to make this real:
//   - Page view counts  → partially available via HealthContext.analysis.slowestPages[].visits
//   - Click-to-register → needs analytics event on the Register button
//   - Form completion   → needs form start/submit timestamps
//   - Drop-off rates    → needs funnel step tracking
//
// Until then, this section shows illustrative UI with "—" values.
// Wire to real data when event tracking is integrated.

import React from "react";
import { IconType } from "react-icons";
import {
  LuFilter,
  LuMousePointerClick,
  LuUserCheck,
  LuCircleAlert,
  LuArrowDownRight,
  LuTarget,
  LuInfo,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

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

export const AdminAnalyticsConversionSection: React.FC = () => (
  <div className={cn('space-y-8', 'mb-16')}>
    <div className={cn('flex', 'items-center', 'gap-3')}>
      <div className={cn('p-2.5', 'bg-primary/10', 'text-foreground', 'rounded-xl', 'border', 'border-primary/20')}>
        <LuTarget className={cn('w-5', 'h-5')} />
      </div>
      <div>
        <h2 className={cn('text-xl', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
          Growth Optimization
        </h2>
        <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
          Funnel performance & conversion bottlenecks
        </p>
      </div>
    </div>

    {/* Honest TODO banner */}
    <div className={cn('flex', 'items-start', 'gap-3', 'p-4', 'bg-amber-50', 'border', 'border-amber-100', 'rounded-2xl')}>
      <LuInfo className={cn('w-4', 'h-4', 'text-amber-600', 'shrink-0', 'mt-0.5')} />
      <p className={cn('text-[11px]', 'font-bold', 'text-amber-700', 'leading-relaxed')}>
        All values below are illustrative placeholders — funnel tracking (page
        views, click events, form timing) is not yet implemented. Wire to a real
        analytics event pipeline before presenting this data.
        {/* TODO: POST /api/analytics/event { type, eventId, metadata } and build aggregation */}
      </p>
    </div>

    <div className={cn('grid', 'grid-cols-1', 'xl:grid-cols-3', 'gap-8')}>
      <div className={cn('xl:col-span-2', 'bg-background', 'border', 'border-border', 'rounded-[2.5rem]', 'p-10', 'shadow-sm')}>
        <h3 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight', 'mb-2')}>
          Acquisition Funnel
        </h3>
        <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mb-8')}>
          Illustrative — not real data
        </p>
        <div className="space-y-4">
          <FunnelStep
            label="Event Page Views"
            value="—"
            percent={100}
            color="bg-foreground"
          />
          <div className={cn('flex', 'justify-center', 'my-1', 'text-slate-300')}>
            <LuArrowDownRight className={cn('w-4', 'h-4')} />
            <span className={cn('text-[8px]', 'font-black', 'ml-2')}>
              Drop-off (not tracked)
            </span>
          </div>
          <FunnelStep
            label="Clicked Register"
            value="—"
            percent={58}
            color="bg-slate-700"
          />
          <div className={cn('flex', 'justify-center', 'my-1', 'text-slate-300')}>
            <LuArrowDownRight className={cn('w-4', 'h-4')} />
            <span className={cn('text-[8px]', 'font-black', 'ml-2')}>
              Drop-off (not tracked)
            </span>
          </div>
          <FunnelStep
            label="Completed Ticket"
            value="—"
            percent={49}
            color="bg-primary"
          />
        </div>
      </div>

      <div className={cn('bg-rose-50', 'border', 'border-rose-100', 'rounded-[2.5rem]', 'p-10', 'flex', 'flex-col')}>
        <div className={cn('space-y-1', 'mb-8')}>
          <h3 className={cn('text-sm', 'font-black', 'text-rose-900', 'uppercase', 'tracking-tight', 'flex', 'items-center', 'gap-2')}>
            <LuCircleAlert className={cn('w-4', 'h-4')} /> Critical Drop-offs
          </h3>
          <p className={cn('text-[10px]', 'font-bold', 'text-rose-400', 'uppercase', 'tracking-widest')}>
            Illustrative only
          </p>
        </div>
        <div className={cn('flex-1', 'space-y-6')}>
          <DropoffItem
            stage="Email Verification"
            rate="—"
            desc="Requires tracking data"
          />
          <DropoffItem
            stage="Invite Code Validation"
            rate="—"
            desc="Requires tracking data"
          />
          <DropoffItem
            stage="Profile Completion"
            rate="—"
            desc="Requires tracking data"
          />
        </div>
      </div>
    </div>

    <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-6')}>
      <ConversionStat
        icon={LuMousePointerClick}
        label="Click-Through Rate"
        value="—"
        status="No data"
      />
      <ConversionStat
        icon={LuUserCheck}
        label="Conv. Rate"
        value="—"
        status="No data"
      />
      <ConversionStat
        icon={LuFilter}
        label="Form Completion"
        value="—"
        status="No data"
      />
    </div>
  </div>
);

const FunnelStep: React.FC<FunnelStepProps> = ({
  label,
  value,
  percent,
  color,
}) => (
  <div>
    <div className={cn('flex', 'justify-between', 'items-end', 'mb-2')}>
      <span className={cn('text-[11px]', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
        {label}
      </span>
      <p className={cn('text-xs', 'font-black', 'text-muted-foreground')}>{value}</p>
    </div>
    <div className={cn('h-10', 'w-full', 'bg-muted', 'rounded-2xl', 'overflow-hidden', 'border', 'border-border')}>
      <div
        className={`h-full ${color} opacity-30 transition-all duration-1000`}
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

const DropoffItem: React.FC<DropoffItemProps> = ({ stage, rate, desc }) => (
  <div className="space-y-1">
    <div className={cn('flex', 'justify-between', 'items-center')}>
      <span className={cn('text-[10px]', 'font-black', 'text-rose-900', 'uppercase', 'tracking-tight')}>
        {stage}
      </span>
      <span className={cn('text-xs', 'font-black', 'text-rose-400')}>{rate}</span>
    </div>
    <p className={cn('text-[9px]', 'font-bold', 'text-rose-400', 'uppercase', 'leading-tight')}>
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
  <div className={cn('bg-background', 'border', 'border-border', 'p-8', 'rounded-[2.5rem]', 'shadow-sm', 'flex', 'items-center', 'justify-between')}>
    <div className="space-y-4">
      <div className={cn('flex', 'items-center', 'gap-2')}>
        <Icon className={cn('w-4', 'h-4', 'text-muted-foreground')} />
        <span className={cn('text-[9px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-[0.2em]')}>
          {label}
        </span>
      </div>
      <h4 className={cn('text-3xl', 'font-black', 'text-muted-foreground', 'tracking-tighter')}>
        {value}
      </h4>
    </div>
    <span className={cn('text-[8px]', 'font-black', 'uppercase', 'tracking-widest', 'bg-muted', 'px-3', 'py-1.5', 'rounded-full', 'border', 'border-border', 'text-muted-foreground')}>
      {status}
    </span>
  </div>
);
