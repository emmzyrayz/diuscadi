"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuEllipsisVertical,
  LuSquarePen,
  LuTrash2,
  LuEye,
  LuCircleX,
  LuCopy,
} from "react-icons/lu";
import { cn } from "../../../../lib/utils";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";

import { Portal } from "@/components/ui/Portal";
import { AdminDeleteEventModal } from "./modals/AEDeleteEventModal";
import { AdminCancelEventModal } from "./modals/AECancelModal";
import { AdminViewEventModal } from "./modals/AEViewModal";

import type { AdminEvent } from "@/context/AdminContext";

// ── Table ─────────────────────────────────────────────────────────────────────

interface TableProps {
  events: AdminEvent[];
  onMutation?: () => void;
  // Page-level edit modal is owned by the page, not the row,
  // so the row calls this callback instead of navigating.
  onEditRequest?: (event: AdminEvent) => void;
}

export const AdminEventsTable: React.FC<TableProps> = ({
  events,
  onMutation,
  onEditRequest,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={cn(
      "w-full",
      "bg-background",
      "border-2",
      "border-border",
      "rounded-2xl",
      "shadow-sm",
    )}
  >
    <div className={cn('w-full', 'h-full')}>
      <table className={cn("w-full", "text-left", "border-collapse")}>
        <thead>
          <tr className={cn("bg-muted/50", "border-b", "border-border")}>
            {[
              "Event Identity",
              "Schedule & Venue",
              "Capacity",
              "Status",
              "Actions",
            ].map((h, i) => (
              <th
                key={h}
                className={cn(
                  "py-5",
                  i === 0 || i === 4 ? "px-8" : "px-6",
                  "text-[10px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-[0.2em]",
                  i === 4 && "text-right",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn("divide-y", "divide-slate-50")}>
          {events.map((event, index) => (
            <AdminEventRow
              key={event.id}
              event={event}
              delay={0.1 + index * 0.05}
              onMutation={onMutation}
              onEditRequest={onEditRequest}
            />
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  event: AdminEvent;
  delay?: number;
  onMutation?: () => void;
  onEditRequest?: (event: AdminEvent) => void;
}

const AdminEventRow: React.FC<RowProps> = ({
  event,
  delay = 0,
  onMutation,
  onEditRequest,
}) => {
  const { token } = useAuth();
  const { deleteEvent } = useAdmin();

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const fillPct =
    event.capacity > 0
      ? Math.round((event.registered / event.capacity) * 100)
      : 0;

  const handleDelete = async () => {
    if (!token) return;
    await deleteEvent(event.id, "delete", token);
    setShowDeleteModal(false);
    onMutation?.();
  };

  const STATUS_STYLES: Record<string, string> = {
    published: "bg-blue-50 text-blue-600 border-blue-100",
    draft: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-rose-50 text-rose-600 border-rose-100",
    completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay }}
        className={cn("group", "hover:bg-muted/50", "transition-colors")}
      >
        {/* Identity */}
        <td className={cn("px-8", "py-6")}>
          <div className={cn("flex", "flex-col")}>
            <span
              className={cn(
                "text-sm",
                "font-black",
                "text-foreground",
                "tracking-tight",
                "group-hover:text-primary",
                "transition-colors",
                "line-clamp-1",
              )}
            >
              {event.title}
            </span>
            <span
              className={cn(
                "text-[10px]",
                "font-bold",
                "text-muted-foreground",
                "uppercase",
                "mt-1",
              )}
            >
              {event.category}
            </span>
          </div>
        </td>

        {/* Schedule */}
        <td className={cn("px-6", "py-6")}>
          <div className="space-y-1.5">
            <div
              className={cn("flex", "items-center", "gap-2", "text-slate-600")}
            >
              <LuCalendar
                className={cn("w-3.5", "h-3.5", "text-muted-foreground")}
              />
              <span className={cn("text-[11px]", "font-bold")}>
                {new Date(event.eventDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-2",
                "text-muted-foreground",
              )}
            >
              <LuMapPin className={cn("w-3.5", "h-3.5", "text-slate-300")} />
              <span className={cn("text-[10px]", "font-medium")}>
                {event.format}
              </span>
            </div>
          </div>
        </td>

        {/* Capacity */}
        <td className={cn("px-6", "py-6")}>
          <div className={cn("flex", "flex-col", "gap-2", "w-32")}>
            <div className={cn("flex", "justify-between", "items-end")}>
              <span
                className={cn("text-[10px]", "font-black", "text-foreground")}
              >
                {event.registered}{" "}
                <span className="text-muted-foreground">
                  / {event.capacity}
                </span>
              </span>
              <span
                className={cn(
                  "text-[8px]",
                  "font-black",
                  "uppercase",
                  fillPct >= 100 ? "text-rose-500" : "text-emerald-500",
                )}
              >
                {fillPct >= 100 ? "Full" : `${fillPct}%`}
              </span>
            </div>
            <div
              className={cn(
                "w-full",
                "h-1.5",
                "bg-muted",
                "rounded-full",
                "overflow-hidden",
              )}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 1, delay: delay + 0.2 }}
                className={cn(
                  "h-full",
                  "rounded-full",
                  fillPct >= 100 ? "bg-rose-500" : "bg-primary",
                )}
              />
            </div>
          </div>
        </td>

        {/* Status */}
        <td className={cn("px-6", "py-6")}>
          <span
            className={cn(
              "px-3",
              "py-1",
              "rounded-full",
              "border",
              "text-[9px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              STATUS_STYLES[event.status] ??
                "bg-muted text-muted-foreground border-border",
            )}
          >
            {event.status}
          </span>
        </td>

        {/* Actions */}
        <td className={cn("px-8", "py-6", "text-right", "relative")}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "p-2",
              "border",
              "border-transparent",
              "hover:border-border",
              "rounded-lg",
              "text-muted-foreground",
              "hover:text-foreground",
              "transition-colors",
              "cursor-pointer",
            )}
          >
            <LuEllipsisVertical className={cn("w-5", "h-5")} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn("fixed", "inset-0", "z-10")}
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={cn(
                    "absolute",
                    "right-8",
                    "top-14",
                    "w-48",
                    "bg-background",
                    "border",
                    "border-border",
                    "rounded-2xl",
                    "shadow-2xl",
                    "z-20",
                    "p-2",
                  )}
                >
                  <MenuItem
                    icon={LuEye}
                    label="View Event"
                    onClick={() => {
                      setShowMenu(false);
                      setShowViewModal(true);
                    }}
                  />

                  {/* Calls the page-level onEditRequest — no router.push */}
                  <MenuItem
                    icon={LuSquarePen}
                    label="Edit Event"
                    onClick={() => {
                      setShowMenu(false);
                      onEditRequest?.(event);
                    }}
                  />

                  <MenuItem
                    icon={LuCopy}
                    label="Duplicate"
                    onClick={() => setShowMenu(false)}
                  />

                  <div className={cn("h-px", "bg-muted", "my-1")} />

                  <MenuItem
                    icon={LuCircleX}
                    label="Cancel Event"
                    color="text-amber-600"
                    onClick={() => {
                      setShowMenu(false);
                      setShowCancelModal(true);
                    }}
                  />

                  <MenuItem
                    icon={LuTrash2}
                    label="Delete Permanent"
                    color="text-rose-600"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </td>
      </motion.tr>

      {/* Modals via Portal to avoid <div> inside <tbody> */}
      <Portal>
        <AdminViewEventModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          event={event}
        />
      </Portal>

      <Portal>
        <AdminCancelEventModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            onMutation?.();
          }}
          eventId={event.id}
          eventName={event.title}
        />
      </Portal>

      <Portal>
        <AdminDeleteEventModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          eventName={event.title}
        />
      </Portal>
    </>
  );
};

// ── MenuItem ──────────────────────────────────────────────────────────────────

const MenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  color?: string;
  onClick: () => void;
}> = ({ icon: Icon, label, color = "text-slate-600", onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full",
      "flex",
      "items-center",
      "gap-3",
      "px-3",
      "py-2.5",
      "rounded-xl",
      "hover:bg-muted",
      "transition-colors",
      "cursor-pointer",
      color,
    )}
  >
    <Icon className={cn("w-4", "h-4")} />
    <span
      className={cn("text-[10px]", "font-black", "uppercase", "tracking-tight")}
    >
      {label}
    </span>
  </button>
);
