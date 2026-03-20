"use client";
// components/sections/events/EventsListingClient.tsx
//
// Client wrapper that owns filter state and connects:
//   EventsFilterBar → filters → EventsTabs + EventsGrid
//
// The server page fetches all events (up to 50) and passes them here.
// Filtering and tab switching are done client-side — no refetch needed.

import React, { useState, useMemo } from "react";
import { EventsFilterBar, FilterState } from "./eventFilter";
import { FeaturedEvent } from "./featuredEvent";
import { EventsTabs } from "./eventTabs";
import { EventsGrid } from "./eventGrid";
import type { EventItem, SpotlightEvent, TabCount } from "@/app/events/page";

interface Props {
  events: EventItem[];
  spotlight: SpotlightEvent | null;
  counts: TabCount;
  categories: string[];
}

export const EventsListingClient = ({
  events,
  spotlight,
  counts,
  categories,
}: Props) => {
  const [filters, setFilters] = useState<FilterState>({
    status: "All",
    location: "All Locations",
    category: "All Categories",
    price: "All Prices",
    date: "All Dates",
    search: "",
  });

  // Client-side filter — runs whenever filters change
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Status / tag filter
      if (filters.status !== "All" && e.tag !== filters.status) return false;

      // Category filter
      if (
        filters.category !== "All Categories" &&
        e.category !== filters.category
      )
        return false;

      // Location filter — matches against the location string
      if (
        filters.location !== "All Locations" &&
        !e.location.toLowerCase().includes(filters.location.toLowerCase()) &&
        filters.location !== "Online"
      )
        return false;

      // Price filter
      if (filters.price === "Free" && !e.isFree) return false;
      if (
        filters.price !== "All Prices" &&
        filters.price !== "Free" &&
        e.isFree
      )
        return false;

      // Search filter — title match
      if (
        filters.search &&
        !e.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;

      return true;
    });
  }, [events, filters]);

  // Recompute tab counts from filtered results
  const filteredCounts: TabCount = useMemo(
    () => ({
      all: filteredEvents.length,
      upcoming: filteredEvents.filter((e) => e.tag !== "Past").length,
      past: filteredEvents.filter((e) => e.tag === "Past").length,
    }),
    [filteredEvents],
  );

  return (
    <>
      <EventsFilterBar categories={categories} onFilterChange={setFilters} />
      {spotlight && <FeaturedEvent event={spotlight} />}
      <EventsTabs counts={filteredCounts} />
      <EventsGrid events={filteredEvents} />
    </>
  );
};
