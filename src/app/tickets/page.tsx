import { TicketHelpSection } from "@/components/sections/events/tickets/TicketHelp";
import { TicketPageHeader } from "@/components/sections/tickets/TicketHeader";
import { TicketStatsOverview } from "@/components/sections/tickets/TicketStat";
import { TicketTabs } from "@/components/sections/tickets/TicketTabs";
import { cn } from "../../lib/utils";
import { TicketFilterAndSearchBar } from "@/components/sections/tickets/TicketFaS";
import { TicketListSection } from "@/components/sections/tickets/TicketList";
import { DUMMY_TICKETS } from "@/assets/data/tickets";

export default function TicketDashboard() {
  return (
    <main className={cn("min-h-screen mt-15", "bg-white")}>
      {/* 1. Identity & Context */}
      <TicketPageHeader />

      {/* 2. Data Overview */}
      <TicketStatsOverview />

      {/* 3. Sticky Control Bar */}
      <div
        className={cn(
          "sticky",
          "top-0",
          "z-40",
          "bg-white/80",
          "backdrop-blur-md",
          "border-b",
          "border-slate-100",
          "py-4",
          "mb-8",
        )}
      >
        <div className={cn("max-w-7xl", "mx-auto", "px-4", "space-y-4")}>
          <TicketFilterAndSearchBar />
          <TicketTabs />
        </div>
      </div>

      {/* 4. Vertical Ticket List - Pass array of tickets */}
      <TicketListSection tickets={DUMMY_TICKETS} />

      <TicketHelpSection />
    </main>
  );
}
