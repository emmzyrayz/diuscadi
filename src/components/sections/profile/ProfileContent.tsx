"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuUser,
  LuBriefcase,
  LuAward,
  LuActivity,
  LuGlobe,
  LuLinkedin,
  LuCircleCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

// Define proper TypeScript interfaces
interface User {
  name: string;
  email: string;
  bio?: string;
  occupation?: string;
  company?: string;
  linkedin?: string;
  website?: string;
  membershipTier?: string;
  membershipBenefits?: string[];
  eventsAttended?: number;
  programsCompleted?: number;
  communityPoints?: number;
}

interface ProfileContentAreaProps {
  user: User;
}

interface DataPointProps {
  label: string;
  value: string;
  className?: string;
}

interface SocialBadgeProps {
  icon: IconType;
  label: string;
  link?: string;
}

interface ActivityRowProps {
  label: string;
  count: string;
}

export const ProfileContentArea = ({ user }: ProfileContentAreaProps) => {
  const defaultBenefits = [
    "Priority Event Access",
    "Direct Mentorship",
    "Workspace Credits",
  ];

  return (
    <div className={cn("space-y-8", "pb-20")}>
      {/* 1. ProfileInfoSection - Personal Identity */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn(
          "bg-white",
          "border-2",
          "border-slate-100",
          "rounded-[2.5rem]",
          "p-8",
          "md:p-10",
          "shadow-sm",
        )}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={cn("flex", "items-center", "gap-3", "mb-8")}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn(
              "w-10",
              "h-10",
              "rounded-xl",
              "bg-slate-50",
              "flex",
              "items-center",
              "justify-center",
              "text-primary",
              "border",
              "border-slate-100",
            )}
          >
            <LuUser className={cn("w-5", "h-5")} />
          </motion.div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-slate-900",
              "tracking-tight",
            )}
          >
            Personal Profile
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-8")}
        >
          <DataPoint label="Full Name" value={user.name} />
          <DataPoint label="Email Address" value={user.email} />
          <DataPoint
            label="Biography"
            value={user.bio || "No biography provided yet."}
            className="md:col-span-2"
          />
        </motion.div>
      </motion.section>

      {/* 2. ProfessionalInfoSection - Ecosystem Role */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={cn(
          "bg-white",
          "border-2",
          "border-slate-100",
          "rounded-[2.5rem]",
          "p-8",
          "md:p-10",
          "shadow-sm",
        )}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={cn("flex", "items-center", "gap-3", "mb-8")}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn(
              "w-10",
              "h-10",
              "rounded-xl",
              "bg-slate-50",
              "flex",
              "items-center",
              "justify-center",
              "text-primary",
              "border",
              "border-slate-100",
            )}
          >
            <LuBriefcase className={cn("w-5", "h-5")} />
          </motion.div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-slate-900",
              "tracking-tight",
            )}
          >
            Professional Context
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-8")}
        >
          <DataPoint
            label="Occupation"
            value={user.occupation || "Founder / Entrepreneur"}
          />
          <DataPoint
            label="Organization"
            value={user.company || "DIUSCADI Hub"}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
              "md:col-span-2",
              "flex",
              "flex-wrap",
              "gap-4",
              "pt-2",
            )}
          >
            <SocialBadge
              icon={LuLinkedin}
              label="LinkedIn"
              link={user.linkedin}
            />
            <SocialBadge icon={LuGlobe} label="Website" link={user.website} />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* 3. MembershipInfoSection - Tier & Benefits + Activity Stats */}
      <section className={cn("grid", "grid-cols-1", "lg:grid-cols-2", "gap-6")}>
        {/* Membership Tier Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={cn(
            "bg-linear-to-br",
            "from-slate-900",
            "to-slate-800",
            "rounded-[2.5rem]",
            "p-8",
            "text-white",
            "relative",
            "overflow-hidden",
          )}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={cn(
              "absolute",
              "-top-20",
              "-right-20",
              "w-40",
              "h-40",
              "bg-primary/20",
              "rounded-full",
              "blur-3xl",
            )}
          />

          <div className={cn("relative", "z-10")}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn("flex", "justify-between", "items-start", "mb-6")}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <LuAward className={cn("w-8", "h-8", "text-primary")} />
              </motion.div>
              <span
                className={cn(
                  "px-3",
                  "py-1",
                  "bg-white/10",
                  "rounded-full",
                  "text-[9px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "border",
                  "border-white/10",
                )}
              >
                Active Status
              </span>
            </motion.div>

            <p
              className={cn(
                "text-[10px]",
                "font-black",
                "text-slate-400",
                "uppercase",
                "tracking-widest",
                "mb-1",
              )}
            >
              Current Tier
            </p>
            <h4 className={cn("text-2xl", "font-black", "mb-4")}>
              {user.membershipTier || "Incubation Alpha"}
            </h4>

            <ul className="space-y-2">
              {(user.membershipBenefits || defaultBenefits).map(
                (benefit, index) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2",
                      "text-xs",
                      "font-medium",
                      "text-slate-300",
                    )}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.6 + index * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <LuCircleCheck
                        className={cn("w-4", "h-4", "text-emerald-500")}
                      />
                    </motion.div>
                    {benefit}
                  </motion.li>
                ),
              )}
            </ul>
          </div>
        </motion.div>

        {/* 4. ActivitySummarySection - Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className={cn(
            "bg-white",
            "border-2",
            "border-slate-100",
            "rounded-[2.5rem]",
            "p-8",
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={cn("flex", "items-center", "gap-3", "mb-6")}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                "w-10",
                "h-10",
                "rounded-xl",
                "bg-slate-50",
                "flex",
                "items-center",
                "justify-center",
              )}
            >
              <LuActivity className={cn("w-5", "h-5", "text-primary")} />
            </motion.div>
            <h3
              className={cn(
                "text-lg",
                "font-black",
                "text-slate-900",
                "tracking-tight",
              )}
            >
              Activity Log
            </h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <ActivityRow
              label="Events Attended"
              count={user.eventsAttended?.toString() || "14"}
              delay={0.7}
            />
            <ActivityRow
              label="Programs Completed"
              count={user.programsCompleted?.toString() || "02"}
              delay={0.8}
            />
            <ActivityRow
              label="Community Points"
              count={user.communityPoints?.toLocaleString() || "1,240"}
              delay={0.9}
            />
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

/* --- Internal Sub-Components --- */

const DataPoint = ({ label, value, className }: DataPointProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3 }}
    className={cn("space-y-1", className)}
  >
    <p className={cn('text-[9px]', 'font-black', 'text-slate-400', 'uppercase', 'tracking-widest')}>
      {label}
    </p>
    <p className={cn('text-sm', 'font-bold', 'text-slate-700', 'leading-relaxed')}>{value}</p>
  </motion.div>
);

const SocialBadge = ({ icon: Icon, label, link }: SocialBadgeProps) => (
  <motion.a
    href={link || "#"}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    className={cn('flex', 'items-center', 'gap-2', 'px-4', 'py-2', 'bg-slate-50', 'border', 'border-slate-100', 'rounded-xl', 'text-xs', 'font-bold', 'text-slate-600', 'hover:text-primary', 'hover:border-primary/30', 'transition-colors')}
  >
    <Icon className={cn('w-4', 'h-4')} />
    {label}
  </motion.a>
);

const ActivityRow = ({
  label,
  count,
  delay = 0,
}: ActivityRowProps & { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    whileHover={{ x: 4 }}
    className={cn('flex', 'items-center', 'justify-between', 'p-3', 'rounded-xl', 'hover:bg-slate-50', 'transition-colors')}
  >
    <span className={cn('text-xs', 'font-bold', 'text-slate-500')}>{label}</span>
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: delay + 0.1, type: "spring", stiffness: 300 }}
      className={cn('text-sm', 'font-black', 'text-slate-900')}
    >
      {count}
    </motion.span>
  </motion.div>
);

// Export types for reuse
export type {
  User,
  ProfileContentAreaProps,
  DataPointProps,
  SocialBadgeProps,
  ActivityRowProps,
};
