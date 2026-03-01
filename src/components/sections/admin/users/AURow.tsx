"use client";
import Image from "next/image";
import React, { useState } from "react";
import {
  LuEllipsis,
  LuCopy,
  LuCircleCheck,
  LuEye,
  LuSquarePen,
  LuShieldAlert,
  LuBan,
  LuCalendarDays,
  LuHash,
} from "react-icons/lu";
import { DropdownItemProps } from "./AUTable";

// 1. TypeScript Interface based on your schema
export interface UserData {
  id: string;
  avatar: string;
  name: string;
  email: string;
  inviteCode: string;
  registrationType: "Student" | "Graduate" | "Professional";
  verificationStatus: "Verified" | "Unverified" | "Incomplete";
  accountStatus: "Active" | "Suspended" | "Banned";
  joinedDate: string;
}

interface AdminUserRowProps {
  user: UserData;
  isSelected: boolean;
  onToggle: () => void;
}

export const AdminUserRow: React.FC<AdminUserRowProps> = ({
  user,
  isSelected,
  onToggle,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copiedField, setCopiedField] = useState<"email" | "invite" | null>(
    null,
  );

  const handleCopy = (text: string, field: "email" | "invite") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isBanned = user.accountStatus === "Banned";

  return (
    <tr
      className={`group transition-all border-b border-slate-50 last:border-0 ${isSelected ? "bg-primary/5" : "hover:bg-slate-50/80"} ${isBanned ? "opacity-75" : ""}`}
    >
      {/* 1. UserCheckbox */}
      <td className="pl-8 pr-4 py-5 relative">
        {isBanned && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
        )}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all"
        />
      </td>

      {/* 2 & 3. UserAvatar + UserName + Email */}
      <td className="px-6 py-5 min-w-[250px]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
              <Image
                height={300}
                width={500}
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            {user.verificationStatus === "Verified" && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
                <LuCircleCheck className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span
              className={`text-sm font-black tracking-tight ${isBanned ? "text-slate-500 line-through" : "text-slate-900 group-hover:text-primary transition-colors"}`}
            >
              {user.name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400 lowercase truncate max-w-[150px]">
                {user.email}
              </span>
              <button
                onClick={() => handleCopy(user.email, "email")}
                className="text-slate-300 hover:text-slate-900 transition-colors"
              >
                {copiedField === "email" ? (
                  <LuCircleCheck className="w-3 h-3 text-emerald-500" />
                ) : (
                  <LuCopy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </td>

      {/* 4. InviteCode & 8. JoinedDate (Grouped for layout efficiency) */}
      <td className="px-6 py-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <LuHash className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-black text-slate-900 font-mono tracking-widest">
              {user.inviteCode}
            </span>
            <button
              onClick={() => handleCopy(user.inviteCode, "invite")}
              className="text-slate-300 hover:text-primary transition-colors"
            >
              {copiedField === "invite" ? (
                <LuCircleCheck className="w-3 h-3 text-emerald-500" />
              ) : (
                <LuCopy className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <LuCalendarDays className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              Joined {user.joinedDate}
            </span>
          </div>
        </div>
      </td>

      {/* 5, 6, 7. Badges (Registration, Verification, Account Status) */}
      <td className="px-6 py-5">
        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
          <Badge type="registration" value={user.registrationType} />
          <Badge type="verification" value={user.verificationStatus} />
          <Badge type="account" value={user.accountStatus} />
        </div>
      </td>

      {/* 9. UserActionsDropdown */}
      <td className="px-8 py-5 text-right relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all shadow-sm"
        >
          <LuEllipsis className="w-5 h-5" />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-8 top-12 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 p-2 animate-in fade-in zoom-in-95 duration-200">
              <DropdownItem icon={LuEye} label="View Profile" />
              <DropdownItem icon={LuSquarePen} label="Edit Details" />
              <div className="h-px bg-slate-50 my-1" />
              {user.accountStatus !== "Banned" ? (
                <>
                  <DropdownItem
                    icon={LuShieldAlert}
                    label="Suspend User"
                    color="text-amber-600"
                  />
                  <DropdownItem
                    icon={LuBan}
                    label="Ban Account"
                    color="text-rose-600"
                  />
                </>
              ) : (
                <DropdownItem
                  icon={LuCircleCheck}
                  label="Restore Account"
                  color="text-emerald-600"
                />
              )}
            </div>
          </>
        )}
      </td>
    </tr>
  );
};

/* --- Internal Helpers for Badges & Dropdown --- */

const Badge = ({ type, value }: { type: string; value: string }) => {
  let colorStyles = "";

  // Dynamic routing for colors based on badge type and value
  if (type === "registration") {
    colorStyles = "bg-slate-100 text-slate-600 border-slate-200"; // Neutral for Reg Type
  } else if (type === "verification") {
    colorStyles =
      value === "Verified"
        ? "bg-blue-50 text-blue-600 border-blue-100"
        : value === "Unverified"
          ? "bg-amber-50 text-amber-600 border-amber-100"
          : "bg-slate-50 text-slate-400 border-slate-200";
  } else if (type === "account") {
    colorStyles =
      value === "Active"
        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
        : value === "Suspended"
          ? "bg-amber-50 text-amber-600 border-amber-100"
          : "bg-rose-50 text-rose-600 border-rose-100";
  }

  return (
    <span
      className={`px-2 py-0.5 rounded-[4px] border text-[8px] font-black uppercase tracking-widest ${colorStyles}`}
    >
      {value}
    </span>
  );
};

const DropdownItem = ({ icon: Icon, label, color = "text-slate-600" }: DropdownItemProps) => (
  <button
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors ${color}`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-[10px] font-black uppercase tracking-tight">
      {label}
    </span>
  </button>
);
