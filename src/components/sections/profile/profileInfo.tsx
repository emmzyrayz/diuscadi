"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuPencilLine,
  LuCircleCheck,
} from "react-icons/lu";
import { IconType } from "react-icons";
import { cn } from "../../../lib/utils";

interface ProfileInfoProps {
  user: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    isVerified: boolean;
  };
  onEdit: () => void;
}

interface InfoFieldProps {
  icon: IconType;
  label: string;
  value: string;
  isVerified?: boolean;
  delay?: number;
}

export const ProfileInfoSection = ({ user, onEdit }: ProfileInfoProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('bg-white', 'border-2', 'border-slate-100', 'rounded-[2.5rem]', 'p-8', 'md:p-10', 'shadow-sm', 'relative', 'overflow-hidden', 'group')}
    >
      {/* Background Decorative Element */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={cn('absolute', 'top-0', 'right-0', 'w-32', 'h-32', 'bg-slate-50', 'rounded-bl-[5rem]', '-mr-10', '-mt-10', 'transition-transform', 'group-hover:-translate-x-2', 'group-hover:translate-y-2', 'duration-500')}
      />

      {/* 1. Section Header */}
      <div className={cn('relative', 'z-10', 'flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'justify-between', 'gap-6', 'mb-10')}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1"
        >
          <div className={cn('flex', 'items-center', 'gap-2', 'text-primary', 'font-black', 'text-[10px]', 'uppercase', 'tracking-[0.2em]')}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <LuUser className={cn('w-3.5', 'h-3.5')} />
            </motion.div>
            Identity
          </div>
          <h3 className={cn('text-2xl', 'font-black', 'text-slate-900', 'tracking-tight')}>
            Personal Information
          </h3>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className={cn('flex', 'items-center', 'justify-center', 'gap-2', 'px-6', 'py-3', 'bg-slate-50', 'hover:bg-slate-900', 'hover:text-white', 'text-slate-600', 'rounded-xl', 'font-black', 'text-[10px]', 'uppercase', 'tracking-widest', 'transition-colors', 'group/btn')}
        >
          <motion.div
            whileHover={{ rotate: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <LuPencilLine className={cn('w-4', 'h-4')} />
          </motion.div>
          Edit Details
        </motion.button>
      </div>

      {/* 2. Information Grid */}
      <div className={cn('relative', 'z-10', 'grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-y-10', 'gap-x-12')}>
        {/* Full Name */}
        <InfoField
          icon={LuUser}
          label="Legal Full Name"
          value={user.name}
          isVerified={user.isVerified}
          delay={0.4}
        />

        {/* Email */}
        <InfoField
          icon={LuMail}
          label="Primary Email"
          value={user.email}
          isVerified={user.isVerified}
          delay={0.5}
        />

        {/* Phone */}
        <InfoField
          icon={LuPhone}
          label="Contact Number"
          value={user.phone || "Not Set"}
          delay={0.6}
        />

        {/* Location */}
        <InfoField
          icon={LuMapPin}
          label="Current Location"
          value={user.location || "Lagos, Nigeria"}
          delay={0.7}
        />
      </div>
    </motion.section>
  );
};

/* Internal Helper Component for Consistency */
const InfoField = ({
  icon: Icon,
  label,
  value,
  isVerified = false,
  delay = 0,
}: InfoFieldProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ x: 4 }}
    className={cn("flex", "items-start", "gap-4", "group/field")}
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "w-12",
        "h-12",
        "rounded-2xl",
        "bg-slate-50",
        "border",
        "border-slate-100",
        "flex",
        "items-center",
        "justify-center",
        "shrink-0",
        "group-hover/field:border-primary/30",
        "transition-colors",
      )}
    >
      <Icon
        className={cn(
          "w-5",
          "h-5",
          "text-slate-400",
          "group-hover/field:text-primary",
          "transition-colors",
        )}
      />
    </motion.div>
    <div className={cn("space-y-1", "flex-1")}>
      <p
        className={cn(
          "text-[9px]",
          "font-black",
          "text-slate-400",
          "uppercase",
          "tracking-widest",
          "leading-none",
        )}
      >
        {label}
      </p>
      <div className={cn("flex", "items-center", "gap-2")}>
        <p className={cn("text-sm", "font-bold", "text-slate-700")}>{value}</p>
        {isVerified && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: delay + 0.2,
              type: "spring",
              stiffness: 300,
              damping: 15,
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 4,
              }}
            >
              <LuCircleCheck
                className={cn("w-3.5", "h-3.5", "text-emerald-500")}
                title="Verified Information"
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  </motion.div>
);

// Export types for reuse
export type { ProfileInfoProps, InfoFieldProps };
