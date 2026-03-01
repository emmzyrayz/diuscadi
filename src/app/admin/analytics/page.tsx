"use client";
import React from "react";

// Layout Sections
import { AdminAnalyticsHeader } from "@/components/sections/admin/analytics/AAHeader";
import { AdminAnalyticsFilters } from "@/components/sections/admin/analytics/AAFilter";
import { AdminAnalyticsOverviewStats } from "@/components/sections/admin/analytics/AAOverviewStats";
import { AdminAnalyticsRevenueSection } from "@/components/sections/admin/analytics/AARevenue";
import { AdminAnalyticsAttendanceSection } from "@/components/sections/admin/analytics/AAAttendance";
import { AdminAnalyticsUserInsightsSection } from "@/components/sections/admin/analytics/AAUserInsights";
import { AdminAnalyticsEventPerformanceSection } from "@/components/sections/admin/analytics/AAEventPerfomance";
import { AdminAnalyticsRecentActivitySection } from "@/components/sections/admin/analytics/AARecentActivity";
import { AdminAnalyticsConversionSection } from "@/components/sections/admin/analytics/AAConversion";

export default function AnalyticsDashboardPage() {
  return (
    <div className="max-w-[1600px] w-full px-5 mt-20 mx-auto pb-20 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* LAYER 1: Global Controls */}
      <section className="space-y-6">
        <AdminAnalyticsHeader />
        <AdminAnalyticsFilters />
      </section>

      {/* LAYER 2: Executive KPIs (Grid-Cols-4) 
          Priority: Revenue, Tickets, Attendance Rate */}
      <section>
        <AdminAnalyticsOverviewStats />
      </section>

      <hr className="border-slate-100" />

      {/* LAYER 3: Financial & Operational Velocity (Grid-Cols-2) */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-12">
        <AdminAnalyticsRevenueSection />
        <AdminAnalyticsAttendanceSection />
      </div>

      {/* LAYER 4: Growth Engineering (Elite Level) */}
      <section className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
        <AdminAnalyticsConversionSection />
      </section>

      {/* LAYER 5: Demographic & Performance (Grid-Cols-2 & Full-Width Tables) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <AdminAnalyticsUserInsightsSection />
        <AdminAnalyticsEventPerformanceSection />
      </div>

      {/* LAYER 6: Real-time Operational Pulse (Full Width) */}
      <section className="max-w-4xl mx-auto">
        <AdminAnalyticsRecentActivitySection />
      </section>
    </div>
  );
}
