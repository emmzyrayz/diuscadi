"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuUser,
  LuMail,
  LuCrown,
  LuCopy,
  LuLayoutDashboard,
  LuUserRoundCog,
  LuTicket,
  LuSettings,
  LuCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { IconType } from "react-icons";

// Define proper TypeScript interfaces
interface User {
  name: string;
  email: string;
  avatar?: string;
  membershipStatus: string;
  inviteCode: string;
}

interface ProfileSidebarProps {
  user: User;
}

interface MenuItem {
  label: string;
  icon: IconType;
  active: boolean;
  href?: string;
}

export const ProfileSidebar = ({ user }: ProfileSidebarProps) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const menuItems: MenuItem[] = [
    { label: "Overview", icon: LuLayoutDashboard, active: true, href: "#" },
    { label: "Edit Profile", icon: LuUserRoundCog, active: false, href: "#" },
    { label: "My Tickets", icon: LuTicket, active: false, href: "#" },
    { label: "Settings", icon: LuSettings, active: false, href: "#" },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <aside className={cn('w-full', 'space-y-6')}>
      {/* 1. Identity Card Segment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn('bg-white', 'border-2', 'border-slate-100', 'rounded-[2.5rem]', 'p-8', 'shadow-sm')}
      >
        <div className={cn('flex', 'flex-col', 'items-center', 'text-center')}>
          {/* Profile Avatar with Upload Indicator */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn('relative', 'group', 'mb-4')}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn('w-32', 'h-32', 'rounded-[2.5rem]', 'bg-slate-50', 'border-4', 'border-white', 'shadow-xl', 'overflow-hidden', 'group-hover:border-primary/20', 'transition-all')}
            >
              {user.avatar ? (
                <Image
                  height={300}
                  width={500}
                  src={user.avatar}
                  className={cn('w-full', 'h-full', 'object-cover')}
                  alt="Avatar"
                />
              ) : (
                <div className={cn('w-full', 'h-full', 'flex', 'items-center', 'justify-center', 'bg-slate-100', 'text-slate-300')}>
                  <LuUser className={cn('w-12', 'h-12')} />
                </div>
              )}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className={cn('absolute', '-bottom-2', '-right-2', 'bg-slate-900', 'text-white', 'p-2.5', 'rounded-xl', 'shadow-lg', 'hover:bg-primary', 'transition-colors')}
            >
              <LuUserRoundCog className={cn('w-4', 'h-4')} />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn('space-y-1', 'mb-6')}
          >
            <h2 className={cn('text-xl', 'font-black', 'text-slate-900', 'tracking-tight')}>
              {user.name}
            </h2>
            <p className={cn('text-xs', 'font-bold', 'text-slate-400', 'flex', 'items-center', 'justify-center', 'gap-1.5')}>
              <LuMail className={cn('w-3.5', 'h-3.5')} /> {user.email}
            </p>
          </motion.div>

          {/* Membership Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className={cn('w-full', 'py-3', 'bg-slate-50', 'rounded-2xl', 'border', 'border-slate-100', 'flex', 'items-center', 'justify-center', 'gap-2')}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <LuCrown className={cn('w-4', 'h-4', 'text-amber-500', 'fill-amber-500')} />
            </motion.div>
            <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-700')}>
              {user.membershipStatus} Member
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* 2. Invite Code Card (The Growth Engine) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={cn('bg-slate-900', 'rounded-[2rem]', 'p-6', 'text-white', 'relative', 'overflow-hidden', 'group')}
      >
        <div className={cn('relative', 'z-10', 'space-y-4')}>
          <div className="space-y-1">
            <p className={cn('text-[9px]', 'font-black', 'text-primary', 'uppercase', 'tracking-[0.2em]')}>
              Referral Program
            </p>
            <h4 className={cn('font-bold', 'text-sm')}>Invite your network</h4>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn('bg-white/10', 'backdrop-blur-md', 'rounded-xl', 'p-3', 'flex', 'items-center', 'justify-between', 'border', 'border-white/10', 'group-hover:border-white/30', 'transition-all')}
          >
            <span className={cn('font-mono', 'text-xs', 'font-black', 'tracking-widest', 'text-primary', 'uppercase')}>
              {user.inviteCode}
            </span>
            <motion.button
              onClick={handleCopyCode}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn('p-1.5', 'hover:bg-white/10', 'rounded-lg', 'text-white/50', 'hover:text-white', 'transition-all')}
            >
              <AnimatePresence mode="wait">
                {copiedCode ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <LuCheck className={cn('w-4', 'h-4', 'text-emerald-400')} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <LuCopy className={cn('w-4', 'h-4')} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
          <p className={cn('text-[9px]', 'text-slate-400', 'font-medium', 'leading-relaxed')}>
            Share this code to earn credits and exclusive event invites.
          </p>
        </div>
        {/* Abstract Background Shape */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn('absolute', '-top-10', '-right-10', 'w-24', 'h-24', 'bg-primary/20', 'rounded-full', 'blur-2xl')}
        />
      </motion.div>

      {/* 3. Quick Navigation Menu */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className={cn('bg-white', 'border-2', 'border-slate-100', 'rounded-[2.5rem]', 'p-4', 'space-y-1')}
      >
        {menuItems.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
              item.active
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                : "text-slate-500 hover:bg-slate-50 hover:text-primary",
            )}
          >
            <motion.div
              animate={item.active ? { scale: [1, 1.2, 1] } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <item.icon
                className={cn(
                  "w-4 h-4",
                  item.active ? "text-primary" : "text-slate-300",
                )}
              />
            </motion.div>
            {item.label}
          </motion.button>
        ))}
      </motion.nav>
    </aside>
  );
};

// Export types for reuse
export type { User, ProfileSidebarProps, MenuItem };
