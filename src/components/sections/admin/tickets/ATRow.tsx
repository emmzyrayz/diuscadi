"use client";
import Image from "next/image";
import React, { useState } from "react";
import { IconType } from "react-icons";
import {
  LuEllipsis,
  LuEye,
  LuCircleCheck,
  LuCircleX,
  LuUser,
  LuCalendar,
  LuHash,
  LuExternalLink,
} from "react-icons/lu";

export interface TicketData {
  id: string;
  ticketCode: string;
  userName: string;
  userAvatar: string;
  eventName: string;
  eventDate: string;
  ticketType: "VIP" | "Regular" | "Student";
  status: "Upcoming" | "Used" | "Cancelled" | "Expired";
  createdDate: string;
}

interface TicketRowProps {
  ticket: TicketData;
  isSelected: boolean;
  onToggle: () => void;
}

interface ActionItemProps {
    icon: IconType;
    label: string;
    color?: string;
}

export const AdminTicketRow: React.FC<TicketRowProps> = ({
  ticket,
  isSelected,
  onToggle,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <tr
      className={`group border-b border-slate-50 last:border-0 transition-all ${isSelected ? "bg-primary/5" : "hover:bg-slate-50/80"}`}
    >
      {/* 1. Checkbox */}
      <td className="pl-8 pr-4 py-5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
        />
      </td>

      {/* 2. TicketCode */}
      <td className="px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg">
            <LuHash className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <span className="text-xs font-black text-slate-900 font-mono tracking-tighter uppercase">
            {ticket.ticketCode}
          </span>
        </div>
      </td>

      {/* 3 & 4. UserAvatar + UserName */}
      <td className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm shrink-0">
            <Image
              height={300}
              width={500}
              src={ticket.userAvatar}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-black text-slate-900 truncate max-w-[140px]">
            {ticket.userName}
          </span>
        </div>
      </td>

      {/* 5 & 6. EventName + EventDate */}
      <td className="px-4 py-5">
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 uppercase leading-tight">
            {ticket.eventName}
          </span>
          <div className="flex items-center gap-1 mt-1 text-slate-400">
            <LuCalendar className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              {ticket.eventDate}
            </span>
          </div>
        </div>
      </td>

      {/* 7. TicketTypeBadge */}
      <td className="px-4 py-5">
        <span
          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.15em] border ${
            ticket.ticketType === "VIP"
              ? "bg-amber-50 text-amber-600 border-amber-100"
              : ticket.ticketType === "Student"
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          {ticket.ticketType}
        </span>
      </td>

      {/* 8. StatusBadge (Visual Logic System) */}
      <td className="px-4 py-5">
        <StatusBadge status={ticket.status} />
      </td>

      {/* 9. CreatedDate */}
      <td className="px-4 py-5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          {ticket.createdDate}
        </span>
      </td>

      {/* 10. TicketActionsDropdown */}
      <td className="pr-8 pl-4 py-5 text-right relative">
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
        >
          <LuEllipsis className="w-5 h-5" />
        </button>

        {showActions && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowActions(false)}
            />
            <div className="absolute right-8 top-12 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 p-2 animate-in fade-in zoom-in-95 duration-200">
              <ActionItem icon={LuEye} label="View Details" />
              <ActionItem
                icon={LuCircleCheck}
                label="Mark as Used"
                color="text-emerald-600"
              />
              <ActionItem
                icon={LuCircleX}
                label="Cancel Ticket"
                color="text-rose-600"
              />
              <div className="h-px bg-slate-50 my-1" />
              <ActionItem icon={LuUser} label="View User" />
              <ActionItem icon={LuExternalLink} label="View Event" />
            </div>
          </>
        )}
      </td>
    </tr>
  );
};

/* --- Badge System Component --- */
const StatusBadge = ({ status }: { status: TicketData["status"] }) => {
  const styles = {
    Upcoming: "bg-blue-50 text-blue-600 border-blue-100",
    Used: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Cancelled: "bg-rose-50 text-rose-600 border-rose-100",
    Expired: "bg-slate-50 text-slate-400 border-slate-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${styles[status]}`}
    >
      {status}
    </span>
  );
};

const ActionItem = ({ icon: Icon, label, color = "text-slate-600" }: ActionItemProps) => (
  <button
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors ${color}`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-[10px] font-black uppercase tracking-tight">
      {label}
    </span>
  </button>
);
