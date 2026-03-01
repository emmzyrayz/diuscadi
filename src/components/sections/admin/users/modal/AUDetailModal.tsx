"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCircleCheck,
  LuHash,
  LuPhone,
  LuMail,
  LuGraduationCap,
  // LuBuilding2,
  LuCalendarDays,
  LuTicket,
  LuCalendar,
  LuActivity,
} from "react-icons/lu";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { UserRowData } from "@/components/sections/admin/users/AUTable";

// 1. TypeScript Interfaces
type TabType = "info" | "tickets" | "events" | "activity";

interface UserDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRowData;
}

interface WithUser {
  user: UserRowData;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: IconType;
  label: string;
}

interface TicketCardProps {
  eventName: string;
  status: "Valid" | "Used" | "Expired";
  code: string;
  date: string;
  delay?: number;
}

interface EventCardProps {
  name: string;
  type: "Physical" | "Virtual";
  role: string;
  delay?: number;
}

interface InfoRowProps {
  icon: IconType;
  label: string;
  value: string;
  delay?: number;
}

interface InfoBlockProps {
  icon: IconType;
  label: string;
  value: string;
  delay?: number;
}

export const AdminUserDetailsModal: React.FC<UserDetailsProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("info");

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-100",
            "flex",
            "items-center",
            "justify-center",
            "p-4",
          )}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn(
              "absolute",
              "inset-0",
              "bg-slate-900/80",
              "backdrop-blur-sm",
            )}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative",
              "w-full",
              "max-w-5xl",
              "bg-white",
              "rounded-[3rem]",
              "shadow-2xl",
              "overflow-hidden",
              "flex",
              "flex-col",
              "max-h-[90vh]",
            )}
          >
            {/* Header / Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={cn(
                "absolute",
                "top-6",
                "right-6",
                "p-3",
                "bg-slate-50",
                "hover:bg-slate-100",
                "rounded-full",
                "text-slate-400",
                "hover:text-slate-900",
                "transition-colors",
                "z-10",
              )}
            >
              <LuX className={cn("w-5", "h-5")} />
            </motion.button>

            <div
              className={cn(
                "flex",
                "flex-col",
                "lg:flex-row",
                "h-full",
                "overflow-hidden",
              )}
            >
              {/* LEFT COLUMN: Identity & Core Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "w-full",
                  "lg:w-1/3",
                  "bg-slate-50",
                  "p-10",
                  "border-r",
                  "border-slate-100",
                  "overflow-y-auto",
                )}
              >
                <UserProfileHeader user={user} />

                <div
                  className={cn(
                    "mt-8",
                    "pt-8",
                    "border-t",
                    "border-slate-200/60",
                  )}
                >
                  <UserInfoSection user={user} />
                </div>
              </motion.div>

              {/* RIGHT COLUMN: Dynamic Tabs (Tickets, Events, Activity) */}
              <div
                className={cn(
                  "w-full",
                  "lg:w-2/3",
                  "flex",
                  "flex-col",
                  "bg-white",
                )}
              >
                {/* Tab Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "flex",
                    "items-center",
                    "gap-8",
                    "px-10",
                    "pt-10",
                    "border-b",
                    "border-slate-100",
                  )}
                >
                  <TabButton
                    active={activeTab === "info"}
                    onClick={() => setActiveTab("info")}
                    icon={LuGraduationCap}
                    label="User Details"
                  />
                  <TabButton
                    active={activeTab === "tickets"}
                    onClick={() => setActiveTab("tickets")}
                    icon={LuTicket}
                    label={`Tickets (${user.ticketsCount})`}
                  />
                  <TabButton
                    active={activeTab === "events"}
                    onClick={() => setActiveTab("events")}
                    icon={LuCalendar}
                    label="Events (5)"
                  />
                  <TabButton
                    active={activeTab === "activity"}
                    onClick={() => setActiveTab("activity")}
                    icon={LuActivity}
                    label="Activity Log"
                  />
                </motion.div>

                {/* Tab Content Area */}
                <div className={cn("flex-1", "overflow-y-auto", "p-10")}>
                  <AnimatePresence mode="wait">
                    {activeTab === "info" && (
                      <ExtendedUserInfo user={user} key="info" />
                    )}
                    {activeTab === "tickets" && (
                      <UserTicketsSection key="tickets" />
                    )}
                    {activeTab === "events" && (
                      <UserEventsSection key="events" />
                    )}
                    {activeTab === "activity" && (
                      <UserActivitySection key="activity" />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* --- 1. UserProfileHeader --- */
const UserProfileHeader: React.FC<WithUser> = ({ user }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.2 }}
    className={cn(
      "flex",
      "flex-col",
      "items-center",
      "text-center",
      "space-y-4",
    )}
  >
    <div className={cn("relative")}>
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "w-28",
          "h-28",
          "rounded-[2rem]",
          "bg-slate-200",
          "overflow-hidden",
          "border-4",
          "border-white",
          "shadow-lg",
        )}
      >
        <Image
          height={300}
          width={500}
          src={user.avatar}
          alt={user.name}
          className={cn("w-full", "h-full", "object-cover")}
        />
      </motion.div>
      <AnimatePresence>
        {user.isVerified && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={cn(
              "absolute",
              "-bottom-2",
              "-right-2",
              "bg-emerald-500",
              "text-white",
              "p-1.5",
              "rounded-xl",
              "border-4",
              "border-slate-50",
              "shadow-sm",
            )}
          >
            <LuCircleCheck className={cn("w-5", "h-5")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <div>
      <h2
        className={cn(
          "text-2xl",
          "font-black",
          "text-slate-900",
          "tracking-tight",
        )}
      >
        {user.name}
      </h2>
      <div
        className={cn(
          "flex",
          "items-center",
          "justify-center",
          "gap-2",
          "mt-2",
        )}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          className={cn(
            "px-3",
            "py-1",
            "bg-primary/10",
            "text-primary",
            "rounded-lg",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "flex",
            "items-center",
            "gap-1",
          )}
        >
          <LuHash className={cn("w-3", "h-3")} /> {user.id}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          whileHover={{ scale: 1.05 }}
          className={cn(
            "px-3",
            "py-1",
            "bg-slate-200",
            "text-slate-600",
            "rounded-lg",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
          )}
        >
          {user.type}
        </motion.span>
      </div>
    </div>
  </motion.div>
);

/* --- 2. UserInfoSection (Sidebar Quick Details) --- */
const UserInfoSection: React.FC<WithUser> = ({ user }) => (
  <div className={cn("space-y-6")}>
    <InfoRow
      icon={LuMail}
      label="Email Address"
      value={user.email}
      delay={0.4}
    />
    <InfoRow
      icon={LuPhone}
      label="Phone Number"
      value="Not Available"
      delay={0.45}
    />
    <InfoRow
      icon={LuCalendarDays}
      label="Last Active"
      value={user.lastActive}
      delay={0.5}
    />
  </div>
);

/* --- Extended Info (Main Panel) --- */
const ExtendedUserInfo: React.FC<WithUser> = ({ user }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className={cn("space-y-8")}
  >
    <h3
      className={cn(
        "text-[11px]",
        "font-black",
        "uppercase",
        "tracking-[0.2em]",
        "text-slate-400",
        "border-b",
        "border-slate-100",
        "pb-4",
      )}
    >
      Account Information
    </h3>
    <div className={cn("grid", "grid-cols-2", "gap-8")}>
      <InfoBlock icon={LuHash} label="User ID" value={user.id} delay={0.1} />
      <InfoBlock
        icon={LuGraduationCap}
        label="Account Type"
        value={user.type}
        delay={0.15}
      />
      <InfoBlock
        icon={LuTicket}
        label="Total Tickets"
        value={user.ticketsCount.toString()}
        delay={0.2}
      />
      <InfoBlock
        icon={LuActivity}
        label="Account Status"
        value={user.accountStatus}
        delay={0.25}
      />
    </div>
  </motion.div>
);

/* --- 3. UserTicketsSection --- */
const UserTicketsSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className={cn("space-y-4")}
  >
    <TicketCard
      eventName="DIUSCADI Tech Summit 2026"
      status="Valid"
      code="TCK-992-ABC"
      date="Nov 15, 2026"
      delay={0.1}
    />
    <TicketCard
      eventName="Web3 Developers Masterclass"
      status="Used"
      code="TCK-104-XYZ"
      date="Jan 10, 2026"
      delay={0.15}
    />
  </motion.div>
);

const TicketCard: React.FC<TicketCardProps> = ({
  eventName,
  status,
  code,
  date,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.01, borderColor: "rgb(251 146 60)" }}
    className={cn(
      "flex",
      "items-center",
      "justify-between",
      "p-6",
      "bg-slate-50",
      "border",
      "border-slate-200",
      "rounded-3xl",
      "relative",
      "overflow-hidden",
      "group",
      "transition-colors",
    )}
  >
    {/* Decorative Ticket Stub edge */}
    <div
      className={cn(
        "absolute",
        "left-0",
        "top-1/2",
        "-translate-y-1/2",
        "w-3",
        "h-6",
        "bg-white",
        "border-r",
        "border-slate-200",
        "rounded-r-full",
      )}
    />
    <div
      className={cn(
        "absolute",
        "right-0",
        "top-1/2",
        "-translate-y-1/2",
        "w-3",
        "h-6",
        "bg-white",
        "border-l",
        "border-slate-200",
        "rounded-l-full",
      )}
    />

    <div className={cn("pl-4", "space-y-1")}>
      <h4 className={cn("text-sm", "font-black", "text-slate-900")}>
        {eventName}
      </h4>
      <div
        className={cn(
          "flex",
          "items-center",
          "gap-3",
          "text-[10px]",
          "font-bold",
          "text-slate-400",
          "uppercase",
          "tracking-widest",
        )}
      >
        <span>{date}</span> •{" "}
        <span className={cn("text-primary", "font-mono")}>{code}</span>
      </div>
    </div>

    <div className={cn("pr-4")}>
      <span
        className={cn(
          "px-3",
          "py-1.5",
          "rounded-lg",
          "text-[9px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          status === "Valid"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-500",
        )}
      >
        {status}
      </span>
    </div>
  </motion.div>
);

/* --- 4. UserEventsSection --- */
const UserEventsSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-4")}
  >
    <EventCard
      name="DIUSCADI Tech Summit 2026"
      type="Physical"
      role="Attendee"
      delay={0.1}
    />
    <EventCard
      name="Future of AI Panel"
      type="Virtual"
      role="Waitlisted"
      delay={0.15}
    />
  </motion.div>
);

const EventCard: React.FC<EventCardProps> = ({
  name,
  type,
  role,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
    className={cn(
      "p-5",
      "border",
      "border-slate-100",
      "rounded-2xl",
      "transition-all",
      "space-y-3",
    )}
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={cn(
        "w-10",
        "h-10",
        "bg-slate-100",
        "rounded-xl",
        "flex",
        "items-center",
        "justify-center",
      )}
    >
      <LuCalendar className={cn("w-5", "h-5", "text-slate-400")} />
    </motion.div>
    <div>
      <h4
        className={cn(
          "text-xs",
          "font-black",
          "text-slate-900",
          "leading-tight",
        )}
      >
        {name}
      </h4>
      <p
        className={cn(
          "text-[10px]",
          "font-bold",
          "text-slate-400",
          "uppercase",
          "tracking-widest",
          "mt-1",
        )}
      >
        {type}
      </p>
    </div>
    <div className={cn("pt-3", "border-t", "border-slate-50")}>
      <span
        className={cn(
          "text-[9px]",
          "font-black",
          "bg-slate-50",
          "text-slate-600",
          "px-2",
          "py-1",
          "rounded",
          "uppercase",
          "tracking-widest",
        )}
      >
        {role}
      </span>
    </div>
  </motion.div>
);

/* --- 5. UserActivitySection (Stub) --- */
const UserActivitySection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className={cn(
      "flex",
      "flex-col",
      "items-center",
      "justify-center",
      "h-48",
      "text-center",
    )}
  >
    <motion.div
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <LuActivity className={cn("w-8", "h-8", "text-slate-300", "mb-3")} />
    </motion.div>
    <p
      className={cn(
        "text-[11px]",
        "font-black",
        "text-slate-400",
        "uppercase",
        "tracking-widest",
      )}
    >
      System activity logs will appear here.
    </p>
  </motion.div>
);

/* --- Generic Helpers --- */
const InfoRow: React.FC<InfoRowProps> = ({
  icon: Icon,
  label,
  value,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className={cn("flex", "items-center", "gap-4")}
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={cn(
        "w-10",
        "h-10",
        "rounded-xl",
        "bg-white",
        "border",
        "border-slate-100",
        "flex",
        "items-center",
        "justify-center",
        "shrink-0",
      )}
    >
      <Icon className={cn("w-4", "h-4", "text-slate-400")} />
    </motion.div>
    <div className={cn("flex", "flex-col")}>
      <span
        className={cn(
          "text-[9px]",
          "font-black",
          "text-slate-400",
          "uppercase",
          "tracking-widest",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-xs",
          "font-bold",
          "text-slate-900",
          "truncate",
          "max-w-[200px]",
        )}
      >
        {value}
      </span>
    </div>
  </motion.div>
);

const InfoBlock: React.FC<InfoBlockProps> = ({
  icon: Icon,
  label,
  value,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn("space-y-2")}
  >
    <div className={cn("flex", "items-center", "gap-2", "text-slate-400")}>
      <Icon className={cn("w-4", "h-4")} />
      <span
        className={cn(
          "text-[9px]",
          "font-black",
          "uppercase",
          "tracking-widest",
        )}
      >
        {label}
      </span>
    </div>
    <p className={cn("text-sm", "font-bold", "text-slate-900")}>
      {value || "N/A"}
    </p>
  </motion.div>
);

const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon: Icon,
  label,
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={cn(
      "flex",
      "items-center",
      "gap-2",
      "pb-4",
      "border-b-2",
      "transition-colors",
      active
        ? "border-primary text-slate-900"
        : "border-transparent text-slate-400 hover:text-slate-600",
    )}
  >
    <Icon className={cn("w-4", "h-4")} />
    <span
      className={cn(
        "text-[11px]",
        "font-black",
        "uppercase",
        "tracking-widest",
      )}
    >
      {label}
    </span>
  </motion.button>
);

// Export types
export type {
  UserDetailsProps,
  TabType,
  TabButtonProps,
  TicketCardProps,
  EventCardProps,
  InfoRowProps,
  InfoBlockProps,
};
