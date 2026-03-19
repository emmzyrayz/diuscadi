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
import Link from "next/link";
import type { UserProfile } from "@/context/UserContext";

interface ProfileSidebarProps {
  profile: UserProfile;
  onEditAvatar: () => void;
}

export const ProfileSidebar = ({
  profile,
  onEditAvatar,
}: ProfileSidebarProps) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!profile.signupInviteCode) return;
    navigator.clipboard.writeText(profile.signupInviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Build display string from structured fullName object
  const displayName = [
    profile.fullName.firstname,
    profile.fullName.secondname,
    profile.fullName.lastname,
  ]
    .filter(Boolean)
    .join(" ");

  // Extract image URL from CloudinaryImage for <Image src>
  const avatarUrl = profile.hasAvatar
    ? (profile.avatar?.imageUrl ?? null)
    : null;

  const menuItems = [
    {
      label: "Overview",
      icon: LuLayoutDashboard,
      href: "/profile",
      active: true,
    },
    {
      label: "Edit Profile",
      icon: LuUserRoundCog,
      href: "/profile/edit",
      active: false,
    },
    { label: "My Tickets", icon: LuTicket, href: "/tickets", active: false },
    { label: "Settings", icon: LuSettings, href: "/settings", active: false },
  ];

  const statusLabel: Record<string, string> = {
    approved: "Active",
    pending: "Pending",
    suspended: "Suspended",
  };

  return (
    <aside className="w-full space-y-6">
      {/* ── Identity card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass rounded-[2.5rem] p-8"
      >
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative group mb-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "w-32 h-32 rounded-[2.5rem] bg-muted border-4 border-border",
                "shadow-xl overflow-hidden group-hover:border-primary/20 transition-all",
              )}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <LuUser className="w-12 h-12" />
                </div>
              )}
            </motion.div>

            {/* Edit avatar button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEditAvatar}
              className={cn(
                "absolute -bottom-2 -right-2",
                "bg-foreground text-background p-2.5 rounded-xl shadow-lg",
                "hover:bg-primary transition-colors cursor-pointer",
              )}
              aria-label="Change avatar"
            >
              <LuUserRoundCog className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Name + email */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-1 mb-6"
          >
            <h2 className="text-xl font-black text-foreground tracking-tight">
              {displayName}
            </h2>
            <p className="text-xs font-bold text-muted-foreground flex items-center justify-center gap-1.5">
              <LuMail className="w-3.5 h-3.5" />
              {profile.email}
            </p>
          </motion.div>

          {/* Membership status badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={cn(
              "w-full py-3 bg-muted rounded-2xl border border-border",
              "flex items-center justify-center gap-2",
            )}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <LuCrown className="w-4 h-4 text-amber-500 fill-amber-500" />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
              {statusLabel[profile.membershipStatus] ??
                profile.membershipStatus}{" "}
              Member
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Invite / referral card ── */}
      {profile.signupInviteCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-foreground rounded-[2rem] p-6 text-background relative overflow-hidden group"
        >
          <div className="relative z-10 space-y-4">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                Referral Program
              </p>
              <h4 className="font-bold text-sm">Invite your network</h4>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={cn(
                "bg-background/10 backdrop-blur-md rounded-xl p-3",
                "flex items-center justify-between",
                "border border-background/10 group-hover:border-background/30 transition-all",
              )}
            >
              <span className="font-mono text-xs font-black tracking-widest text-primary uppercase">
                {profile.signupInviteCode}
              </span>

              <motion.button
                onClick={handleCopyCode}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 hover:bg-background/10 rounded-lg text-background/50 hover:text-background transition-all cursor-pointer"
                aria-label="Copy invite code"
              >
                <AnimatePresence mode="wait">
                  {copiedCode ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <LuCheck className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <LuCopy className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            <p className="text-[9px] text-muted-foreground font-medium leading-relaxed">
              Share this code to earn credits and exclusive event invites.
            </p>
          </div>

          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl"
          />
        </motion.div>
      )}

      {/* ── Nav menu ── */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass rounded-[2.5rem] p-4 space-y-1"
      >
        {menuItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.08 }}
          >
            <Link
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl",
                "text-[11px] font-black uppercase tracking-widest transition-all",
                item.active
                  ? "bg-foreground text-background shadow-lg shadow-foreground/10"
                  : "text-muted-foreground hover:bg-muted hover:text-primary",
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4",
                  item.active ? "text-primary" : "text-muted-foreground",
                )}
              />
              {item.label}
            </Link>
          </motion.div>
        ))}
      </motion.nav>
    </aside>
  );
};
