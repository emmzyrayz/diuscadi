"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuTicket,
  LuDownload,
  LuExternalLink,
  LuCalendarPlus,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTickets, type Ticket } from "@/context/TicketContext";
import { EmptyState } from "@/components/sections/tickets/EmptyState";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDisplayStatus(ticket: Ticket): "Upcoming" | "Used" | "Cancelled" {
  if (ticket.status === "cancelled") return "Cancelled";
  if (ticket.checkedInAt) return "Used";
  return "Upcoming";
}

function getLocationString(ticket: Ticket): string {
  if (ticket.event.format === "virtual") return "Online / Zoom";
  const loc = ticket.event.location;
  if (!loc) return ticket.event.format;
  return (
    [loc.venue, loc.city].filter(Boolean).join(", ") || ticket.event.format
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const FORMAT_LABEL: Record<string, string> = {
  physical: "Physical",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

const STATUS_STYLES: Record<string, string> = {
  Upcoming: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Used: "text-muted text-muted-foreground border-border",
  Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

// ── Ticket Card ───────────────────────────────────────────────────────────────

const TicketCard = ({ ticket }: { ticket: Ticket }) => {
  const router = useRouter();
  const displayStatus = getDisplayStatus(ticket);
  const location = getLocationString(ticket);
  const eventDate = fmtDate(ticket.event.eventDate);
  const ticketImage = ticket.event.image || "/images/events/default.jpg";
  const formatLabel = FORMAT_LABEL[ticket.event.format] ?? ticket.event.format;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, scale: 1.005 }}
      className={cn(
        "group",
        "bg-background",
        "border-2",
        "border-border",
        "hover:border-primary/30",
        "rounded-[2.5rem]",
        "overflow-hidden",
        "transition-all",
        "hover:shadow-xl",
        "hover:shadow-slate-200/50",
        "flex",
        "flex-col",
        "md:flex-row",
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative",
          "w-full",
          "md:w-52",
          "h-40",
          "md:h-auto",
          "overflow-hidden",
          "rounded-t-[2.5rem]",
          "md:rounded-l-[2.5rem]",
          "md:rounded-tr-none",
          "shrink-0",
        )}
      >
        <Image
          src={ticketImage}
          alt={ticket.event.title}
          width={208}
          height={192}
          className={cn(
            "w-full",
            "h-full",
            "object-cover",
            "group-hover:scale-110",
            "transition-transform",
            "duration-500",
          )}
        />
        <div className={cn("absolute", "top-4", "left-4")}>
          <span
            className={cn(
              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md bg-background/90 shadow-sm",
              STATUS_STYLES[displayStatus],
            )}
          >
            {displayStatus}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className={cn("flex-1", "p-6", "md:p-8", "space-y-4")}>
        <div className="space-y-1">
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-primary",
            )}
          >
            <LuTicket className={cn("w-3", "h-3")} />
            {formatLabel} Access · {ticket.ticketType.name}
          </div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-foreground",
              "leading-tight",
              "group-hover:text-primary",
              "transition-colors",
            )}
          >
            {ticket.event.title}
          </h3>
        </div>
        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "sm:grid-cols-2",
            "gap-y-2",
            "gap-x-6",
          )}
        >
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-muted-foreground",
              "text-xs",
              "font-bold",
            )}
          >
            <LuCalendar className={cn("w-4", "h-4", "text-slate-300")} />{" "}
            {eventDate}
          </div>
          <div
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "text-muted-foreground",
              "text-xs",
              "font-bold",
            )}
          >
            <LuMapPin className={cn("w-4", "h-4", "text-slate-300")} />
            <span className="truncate">{location}</span>
          </div>
        </div>
        <div className="pt-1">
          <span
            className={cn(
              "text-[10px]",
              "font-mono",
              "text-slate-300",
              "uppercase",
              "tracking-widest",
            )}
          >
            {ticket.inviteCode}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div
        className={cn(
          "w-full",
          "md:w-60",
          "bg-muted/50",
          "p-6",
          "md:p-8",
          "border-t",
          "md:border-t-0",
          "md:border-l",
          "border-border",
          "flex",
          "flex-col",
          "justify-center",
          "gap-3",
        )}
      >
        <button
          onClick={() => router.push(`/tickets/${ticket.id}`)}
          className={cn(
            "w-full",
            "py-3",
            "bg-foreground",
            "text-background",
            "rounded-xl",
            "text-xs",
            "font-black",
            "uppercase",
            "tracking-widest",
            "hover:bg-primary",
            "transition-all",
            "flex",
            "items-center",
            "justify-center",
            "gap-2",
            "cursor-pointer",
          )}
        >
          View Ticket <LuExternalLink className={cn("w-4", "h-4")} />
        </button>
        <div className={cn("grid", "grid-cols-2", "gap-2")}>
          <button
            className={cn(
              "py-3",
              "bg-background",
              "border",
              "border-border",
              "text-slate-600",
              "rounded-xl",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "hover:border-slate-400",
              "transition-all",
              "flex",
              "items-center",
              "justify-center",
              "gap-1.5",
              "cursor-pointer",
            )}
          >
            <LuDownload className={cn("w-3.5", "h-3.5")} /> PDF
          </button>
          <button
            className={cn(
              "py-3",
              "bg-background",
              "border",
              "border-border",
              "text-slate-600",
              "rounded-xl",
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "hover:border-slate-400",
              "transition-all",
              "flex",
              "items-center",
              "justify-center",
              "gap-1.5",
              "cursor-pointer",
            )}
          >
            <LuCalendarPlus className={cn("w-3.5", "h-3.5")} /> Sync
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── List Section ──────────────────────────────────────────────────────────────

const TicketListSection = ({
  tickets,
  onClearFilters,
}: {
  tickets: Ticket[];
  onClearFilters: () => void;
}) => (
  <section
    className={cn(
      "w-full",
      "max-w-7xl",
      "mx-auto",
      "px-4",
      "sm:px-6",
      "lg:px-8",
      "pb-20",
      "py-8",
      "space-y-6",
    )}
  >
    {tickets.length === 0 ? (
      <EmptyState onClearFilters={onClearFilters} />
    ) : (
      tickets.map((t) => <TicketCard key={t.id} ticket={t} />)
    )}
  </section>
);

export default function TicketsPage() {
  const { tickets, loadTickets, ticketsLoading } = useTickets();

  useEffect(() => {
    loadTickets(); // fetch on mount
  }, [loadTickets]);

  if (ticketsLoading) {
    return <div>Loading tickets...</div>;
  }

  return (
    <div className={cn("w-full", "h-full mt-20")}>
      <TicketListSection
        tickets={tickets}
        onClearFilters={() => loadTickets()}
      />
    </div>
  );
}