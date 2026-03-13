"use client";
// app/home/tickets/page.tsx
// Client page — calls loadTickets() on mount, passes live data down to components.
import React, { useEffect, useState, useMemo } from "react";
import { useTickets } from "@/context/TicketContext";
import type { Ticket } from "@/context/TicketContext";
import { cn } from "@/lib/utils";

import { TicketHelpSection } from "@/components/sections/events/tickets/TicketHelp";
import { TicketPageHeader } from "@/components/sections/tickets/TicketHeader";
import { TicketStatsOverview } from "@/components/sections/tickets/TicketStat";
import { TicketTabs } from "@/components/sections/tickets/TicketTabs";
import { TicketFilterAndSearchBar } from "@/components/sections/tickets/TicketFaS";
import { TicketListSection } from "@/components/sections/tickets/TicketList";
import { TicketPageSkeleton } from "@/components/sections/tickets/Ticketskeleton";

type StatusFilter = "All" | "Upcoming" | "Used" | "Cancelled";
type SortOption = "newest" | "oldest" | "event-date";

// Map RegistrationStatus → display tab
function toTabStatus(ticket: Ticket): StatusFilter {
  if (ticket.status === "cancelled") return "Cancelled";
  if (ticket.checkedInAt) return "Used";
  return "Upcoming";
}

export default function TicketDashboard() {
  const { tickets, ticketsLoading, ticketsError, loadTickets } = useTickets();

  const [activeTab, setActiveTab] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: tickets.length,
      upcoming: tickets.filter((t) => toTabStatus(t) === "Upcoming").length,
      used: tickets.filter((t) => toTabStatus(t) === "Used").length,
      cancelled: tickets.filter((t) => toTabStatus(t) === "Cancelled").length,
    }),
    [tickets],
  );

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...tickets];

    // Tab filter
    if (activeTab !== "All") {
      list = list.filter((t) => toTabStatus(t) === activeTab);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.event.title.toLowerCase().includes(q));
    }

    // Date range
    if (dateFilter === "month") {
      const now = new Date();
      list = list.filter((t) => {
        const d = new Date(t.registeredAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    } else if (dateFilter === "year") {
      const yr = new Date().getFullYear();
      list = list.filter((t) => new Date(t.registeredAt).getFullYear() === yr);
    }

    // Sort
    list.sort((a, b) => {
      if (sort === "event-date") {
        return (
          new Date(a.event.eventDate).getTime() -
          new Date(b.event.eventDate).getTime()
        );
      }
      const aTime = new Date(a.registeredAt).getTime();
      const bTime = new Date(b.registeredAt).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [tickets, activeTab, search, dateFilter, sort]);

  const handleClearFilters = () => {
    setSearch("");
    setDateFilter("all");
    setSort("newest");
    setActiveTab("All");
  };

  if (ticketsLoading) return <TicketPageSkeleton />;

  return (
    <main className={cn("min-h-screen", "bg-background", "mt-15", "pt-[72px]")}>
      {/* 1. Header */}
      <TicketPageHeader ticketCount={stats.total} />

      {/* 2. Stats */}
      <TicketStatsOverview stats={stats} />

      {/* 3. Sticky filter + tabs bar */}
      <div
        className={cn(
          "sticky",
          "top-[72px]",
          "z-40",
          "bg-background/90",
          "backdrop-blur-md",
          "border-b",
          "border-border",
        )}
      >
        <div
          className={cn(
            "max-w-7xl",
            "mx-auto",
            "px-4",
            "sm:px-6",
            "lg:px-8",
            "py-3",
            "space-y-3",
          )}
        >
          <TicketFilterAndSearchBar
            search={search}
            onSearchChange={setSearch}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            sort={sort}
            onSortChange={(v) => setSort(v as SortOption)}
            onClearAll={handleClearFilters}
          />
          <TicketTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={stats}
          />
        </div>
      </div>

      {/* 4. Error banner */}
      {ticketsError && (
        <div className={cn("max-w-7xl", "mx-auto", "px-4", "mt-6")}>
          <p
            className={cn(
              "bg-red-50",
              "text-red-600",
              "text-sm",
              "font-bold",
              "px-5",
              "py-3",
              "rounded-2xl",
              "border",
              "border-red-100",
            )}
          >
            {ticketsError}
          </p>
        </div>
      )}

      {/* 5. Ticket list */}
      <TicketListSection
        tickets={filtered}
        onClearFilters={handleClearFilters}
      />

      <TicketHelpSection />
    </main>
  );
}
