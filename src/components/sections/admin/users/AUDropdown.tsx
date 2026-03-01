"use client";
import React, { useState } from "react";
import { IconType } from "react-icons";
import {
  LuEllipsis,
  LuEye,
  LuSquarePen,
  LuShieldCheck,
  LuShieldAlert,
  LuBan,
  LuTrash2,
} from "react-icons/lu";

// 1. TypeScript Interfaces
interface UserActionsProps {
  userId: string;
  isVerified: boolean;
  accountStatus: "Active" | "Suspended" | "Banned";
  onView: () => void;
  onEdit: () => void;
  onVerify: () => void;
  onSuspend: () => void;
  onBan: () => void;
  onDelete: () => void;
}

export const UserActionsDropdown: React.FC<UserActionsProps> = ({
  isVerified,
  accountStatus,
  onView,
  onEdit,
  onVerify,
  onSuspend,
  onBan,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to close dropdown and fire action
  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative inline-block text-right">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all border ${
          isOpen
            ? "bg-slate-900 text-white border-slate-900 shadow-md"
            : "bg-transparent text-slate-400 border-transparent hover:border-slate-200 hover:bg-white hover:text-slate-900"
        }`}
      >
        <LuEllipsis className="w-5 h-5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Invisible overlay to capture outside clicks */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-12 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
            {/* Safe Actions Group */}
            <div className="space-y-0.5">
              <DropdownItem
                icon={LuEye}
                label="View Full Dossier"
                onClick={() => handleAction(onView)}
              />
              <DropdownItem
                icon={LuSquarePen}
                label="Edit Identity"
                onClick={() => handleAction(onEdit)}
              />
            </div>

            <div className="h-px bg-slate-50 my-1.5 mx-2" />

            {/* Status Modifiers Group */}
            <div className="space-y-0.5">
              {!isVerified && (
                <DropdownItem
                  icon={LuShieldCheck}
                  label="Manually Verify"
                  color="text-emerald-600 hover:bg-emerald-50"
                  onClick={() => handleAction(onVerify)}
                />
              )}
              {accountStatus !== "Suspended" && accountStatus !== "Banned" && (
                <DropdownItem
                  icon={LuShieldAlert}
                  label="Suspend Access"
                  color="text-amber-600 hover:bg-amber-50"
                  onClick={() => handleAction(onSuspend)}
                />
              )}
              {accountStatus !== "Banned" && (
                <DropdownItem
                  icon={LuBan}
                  label="Ban IP & Account"
                  color="text-rose-600 hover:bg-rose-50"
                  onClick={() => handleAction(onBan)}
                />
              )}
            </div>

            <div className="h-px bg-slate-50 my-1.5 mx-2" />

            {/* Destructive Group */}
            <div className="space-y-0.5">
              <DropdownItem
                icon={LuTrash2}
                label="Delete Permanently"
                color="text-rose-700 bg-rose-50/50 hover:bg-rose-100 hover:text-rose-800"
                onClick={() => handleAction(onDelete)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* --- Internal Button Component --- */
export interface ItemProps {
  icon: IconType;
  label: string;
  onClick: () => void;
  color?: string;
}

const DropdownItem: React.FC<ItemProps> = ({
  icon: Icon,
  label,
  onClick,
  color = "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${color}`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-[10px] font-black uppercase tracking-tight">
      {label}
    </span>
  </button>
);
