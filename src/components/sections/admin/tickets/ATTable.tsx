"use client";
import Image from "next/image";
import React, { useState } from "react";
import {
  LuUser,
  LuTicket,
  LuCalendar,
  LuEllipsis,
  LuExternalLink,
  LuShieldCheck,
  LuCircleX,
} from "react-icons/lu";

// 1. TypeScript Interface
export interface TicketRowData {
  id: string;
  ticketCode: string;
  ownerName: string;
  ownerAvatar: string;
  eventName: string;
  eventDate: string;
  ticketType: "VIP" | "Regular" | "Student";
  status: "Upcoming" | "Used" | "Cancelled" | "Expired";
}

const MOCK_TICKETS: TicketRowData[] = [
  {
    id: "T-001",
    ticketCode: "DIU-882-XY",
    ownerName: "Sarah Olanrewaju",
    ownerAvatar: "https://i.pravatar.cc/150?u=sarah",
    eventName: "Tech Summit 2026",
    eventDate: "Nov 15, 2026",
    ticketType: "VIP",
    status: "Upcoming",
  },
  {
    id: "T-002",
    ticketCode: "DIU-104-ZA",
    ownerName: "David Chen",
    ownerAvatar: "https://i.pravatar.cc/150?u=david",
    eventName: "Web3 Masterclass",
    eventDate: "Jan 12, 2026",
    ticketType: "Student",
    status: "Used",
  },
  {
    id: "T-003",
    ticketCode: "DIU-991-BC",
    ownerName: "Marcus Johnson",
    ownerAvatar: "https://i.pravatar.cc/150?u=marcus",
    eventName: "Tech Summit 2026",
    eventDate: "Nov 15, 2026",
    ticketType: "Regular",
    status: "Cancelled",
  },
];

export const AdminTicketsTable: React.FC = () => {
  return (
    <div className="w-full bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="pl-10 pr-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Attendee
              </th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Ticket Identity
              </th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Event Context
              </th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Usage Status
              </th>
              <th className="pr-10 pl-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                Verification
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-50">
            {MOCK_TICKETS.map((ticket) => (
              <AdminTicketRow key={ticket.id} ticket={ticket} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* --- Internal Component: AdminTicketRow --- */
const AdminTicketRow: React.FC<{ ticket: TicketRowData }> = ({ ticket }) => {
  const isInvalid =
    ticket.status === "Cancelled" || ticket.status === "Expired";

  return (
    <tr
      className={`group transition-all hover:bg-slate-50/50 ${isInvalid ? "opacity-60 grayscale-[0.5]" : ""}`}
    >
      {/* 1. Attendee Info */}
      <td className="pl-10 pr-6 py-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                      <Image
                          height={300}
                          width={500}
              src={ticket.ownerAvatar}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">
              {ticket.ownerName}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Attendee Profile
            </span>
          </div>
        </div>
      </td>

      {/* 2. Ticket Identity */}
      <td className="px-6 py-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <LuTicket className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-black text-slate-900 font-mono tracking-tighter">
              {ticket.ticketCode}
            </span>
          </div>
          <span
            className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
              ticket.ticketType === "VIP"
                ? "bg-amber-50 text-amber-600 border-amber-100"
                : ticket.ticketType === "Student"
                  ? "bg-blue-50 text-blue-600 border-blue-100"
                  : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {ticket.ticketType} Pass
          </span>
        </div>
      </td>

      {/* 3. Event Context */}
      <td className="px-6 py-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-slate-700">
            {ticket.eventName}
          </span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <LuCalendar className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              {ticket.eventDate}
            </span>
          </div>
        </div>
      </td>

      {/* 4. Usage Status */}
      <td className="px-6 py-6">
        <span
          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
            ticket.status === "Upcoming"
              ? "bg-emerald-50 text-emerald-600"
              : ticket.status === "Used"
                ? "bg-slate-200 text-slate-500"
                : "bg-rose-50 text-rose-600"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              ticket.status === "Upcoming"
                ? "bg-emerald-500"
                : ticket.status === "Used"
                  ? "bg-slate-400"
                  : "bg-rose-500"
            }`}
          />
          {ticket.status}
        </span>
      </td>

      {/* 5. Actions / Verification */}
      <td className="pr-10 pl-6 py-6 text-right">
        <div className="flex items-center justify-end gap-2">
          {ticket.status === "Upcoming" ? (
            <button
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-primary hover:text-slate-900 transition-all shadow-lg shadow-slate-900/10"
              title="Verify Entry"
            >
              <LuShieldCheck className="w-4 h-4" />
            </button>
          ) : (
            <button className="p-2.5 bg-slate-50 text-slate-300 rounded-xl cursor-not-allowed">
              <LuCircleX className="w-4 h-4" />
            </button>
          )}
          <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
            <LuEllipsis className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
