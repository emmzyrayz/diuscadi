"use client";
// src/components/sections/admin/analytics/AAReferralSection.tsx

import React from "react";
import { cn } from "@/lib/utils";
import { LuShare2, LuUsers, LuCoins, LuGitBranch } from "react-icons/lu";

interface ReferralAnalytics {
  platform: {
    usersWithReferrer: number;
    totalDirectReferrals: number;
    totalIndirectReferrals: number;
    maxTreeDepthReached: number;
    signupReferralPoints: number;
    signupReferralCount: number;
    eventReferralPoints: number;
    eventReferralCount: number;
  };
  topReferrers: {
    userId: string;
    name: string;
    committee: string | null;
    directCount: number;
    indirectCount: number;
    totalEarned: number;
    treeDepthReached: number;
  }[];
}

interface AAReferralSectionProps {
  referral: ReferralAnalytics | null | undefined;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn('p-5', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'space-y-3')}>
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          bg,
        )}
      >
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div>
        <p className={cn('text-2xl', 'font-black', 'text-foreground')}>{value}</p>
        <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5', 'leading-tight')}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function AAReferralSection({ referral }: AAReferralSectionProps) {
  if (!referral) return null;

  const { platform, topReferrers = [] } = referral;
  if (!platform) return null;
  const totalReferralPoints =
    platform.signupReferralPoints + platform.eventReferralPoints;

  return (
    <div className="space-y-6">
      <div className={cn('flex', 'items-center', 'gap-3')}>
        <div className={cn('w-10', 'h-10', 'rounded-2xl', 'bg-emerald-500/10', 'flex', 'items-center', 'justify-center')}>
          <LuShare2 className={cn('w-5', 'h-5', 'text-emerald-500')} />
        </div>
        <div>
          <h2 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
            Referral Analytics
          </h2>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
            Platform referral tree performance
          </p>
        </div>
      </div>

      <div className={cn('grid', 'grid-cols-2', 'sm:grid-cols-4', 'gap-4')}>
        <StatCard
          icon={LuUsers}
          label="Users via Referral"
          value={platform.usersWithReferrer.toLocaleString()}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={LuShare2}
          label="Direct Referrals"
          value={platform.totalDirectReferrals.toLocaleString()}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          icon={LuGitBranch}
          label="Indirect Referrals"
          value={platform.totalIndirectReferrals.toLocaleString()}
          color="text-violet-500"
          bg="bg-violet-500/10"
        />
        <StatCard
          icon={LuCoins}
          label="Referral Points Given"
          value={totalReferralPoints.toLocaleString()}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
      </div>

      <div className={cn('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-4')}>
        <div className={cn('p-5', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'space-y-3')}>
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Signup Referrals
          </p>
          <p className={cn('text-3xl', 'font-black', 'text-foreground')}>
            {platform.signupReferralCount.toLocaleString()}
          </p>
          <p className={cn('text-[11px]', 'text-muted-foreground')}>
            {platform.signupReferralPoints.toLocaleString()} pts distributed
          </p>
        </div>
        <div className={cn('p-5', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'space-y-3')}>
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Event Referrals
          </p>
          <p className={cn('text-3xl', 'font-black', 'text-foreground')}>
            {platform.eventReferralCount.toLocaleString()}
          </p>
          <p className={cn('text-[11px]', 'text-muted-foreground')}>
            {platform.eventReferralPoints.toLocaleString()} pts distributed
          </p>
        </div>
      </div>

      {topReferrers.length > 0 ? (
        <div className="space-y-3">
          <p className={cn('text-[10px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
            Top Referrers
          </p>
          <div className="space-y-2">
            {topReferrers.map((r, idx) => (
              <div
                key={r.userId}
                className={cn('flex', 'items-center', 'gap-4', 'p-4', 'bg-background', 'border', 'border-border', 'rounded-2xl')}
              >
                <div className={cn('w-8', 'h-8', 'rounded-xl', 'bg-muted', 'flex', 'items-center', 'justify-center', 'shrink-0')}>
                  <span className={cn('text-[11px]', 'font-black', 'text-muted-foreground')}>
                    #{idx + 1}
                  </span>
                </div>
                <div className={cn('flex-1', 'min-w-0')}>
                  <p className={cn('text-[11px]', 'font-black', 'text-foreground', 'truncate')}>
                    {r.name}
                  </p>
                  {r.committee && (
                    <p className={cn('text-[9px]', 'font-mono', 'text-muted-foreground/60', 'uppercase', 'mt-0.5')}>
                      {r.committee}
                    </p>
                  )}
                </div>
                <div className={cn('flex', 'items-center', 'gap-4', 'shrink-0', 'text-right')}>
                  <div>
                    <p className={cn('text-[11px]', 'font-black', 'text-emerald-600')}>
                      {r.directCount}
                    </p>
                    <p className={cn('text-[9px]', 'text-muted-foreground')}>direct</p>
                  </div>
                  <div>
                    <p className={cn('text-[11px]', 'font-black', 'text-violet-500')}>
                      {r.indirectCount}
                    </p>
                    <p className={cn('text-[9px]', 'text-muted-foreground')}>indirect</p>
                  </div>
                  <div>
                    <p className={cn('text-[11px]', 'font-black', 'text-amber-500')}>
                      {r.totalEarned}
                    </p>
                    <p className={cn('text-[9px]', 'text-muted-foreground')}>pts</p>
                  </div>
                  <div>
                    <p className={cn('text-[11px]', 'font-black', 'text-muted-foreground')}>
                      D{r.treeDepthReached}
                    </p>
                    <p className={cn('text-[9px]', 'text-muted-foreground')}>depth</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-10', 'gap-2', 'text-center', 'border', 'border-dashed', 'border-border', 'rounded-2xl')}>
          <LuShare2 className={cn('w-7', 'h-7', 'text-muted-foreground/20')} />
          <p className={cn('text-xs', 'font-bold', 'text-muted-foreground/50')}>
            No referral activity yet
          </p>
        </div>
      )}
    </div>
  );
}