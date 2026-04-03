"use client";
// app/verify/ticket/[code]/page.tsx

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import {
  LuCalendar,
  LuMapPin,
  LuTicket,
  LuCircleCheck,
  LuShieldCheck,
  LuLoader,
  LuArrowLeft,
  LuClock,
  LuTriangleAlert,
  LuRefreshCcw,
  LuCircleX,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTickets } from "@/context/TicketContext";
import { toast } from "react-hot-toast";

// Shape returned by GET /api/tickets/verify/[code]
interface VerifyTicket {
  id: string;
  inviteCode: string;
  status: "registered" | "checked-in" | "cancelled";
  registeredAt: string;
  checkedInAt: string | null;
  referralCodeUsed: string | null;
  canCheckIn: boolean;
  event: {
    id: string;
    slug: string;
    title: string;
    overview: string | null;
    format: string;
    location: Record<string, string> | null;
    eventDate: string;
    endDate: string | null;
    registrationDeadline: string;
    duration: string | null;
    image: string;
    category: string;
    instructor: string | null;
    status: string;
  };
  ticketType: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
  owner: {
    name: string;
    email: string;
    avatar: string | null;
    membershipStatus: string;
  } | null;
}

// ── Animation variants ────────────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 280, damping: 24 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
};

const checkInResultVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 22 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -8,
    transition: { duration: 0.18 },
  },
};

export default function VerifyTicketPage() {
  const params = useParams();
  const router = useRouter();
  const code = ((params?.code as string) ?? "").toUpperCase();

  const { token, isAuthenticated, sessionStatus } = useAuth();
  const { checkIn, checkInLoading } = useTickets();
  const [checkInError, setCheckInError] = useState<string | null>(null);

  const [ticket, setTicket] = useState<VerifyTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!token || !code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/verify/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ticket not found");
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [token, code]);

  useEffect(() => {
    // Fix 1: SessionStatus is "pending" | "restored" | "unauthenticated" — not "loading"
    if (sessionStatus === "unauthenticated") {
      router.replace(`/login?next=/verify/ticket/${code}`);
      return;
    }
    if (isAuthenticated) fetchTicket();
  }, [isAuthenticated, sessionStatus, fetchTicket, router, code]);

  const handleCheckIn = async () => {
    if (!ticket || checking) return;
    setChecking(true);
    const result = await checkIn(ticket.inviteCode);
    if (result.success) {
      toast.success("Check-in successful");
      await fetchTicket();
    } else {
      setCheckInError(result.error ?? "Check-in failed"); // modal handles all errors
    }
    setChecking(false);
  };

  {
    /* ── Check-in error modal ── */
  }
  

  // ── Loading ──────────────────────────────────────────────────────────────
  // Fix 1 applied: sessionStatus === "pending" instead of "loading"
  if (loading || sessionStatus === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('min-h-screen w-full', 'flex', 'items-center', 'justify-center', 'bg-background')}
      >
        <div className={cn('flex', 'flex-col', 'items-center', 'gap-4')}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <LuLoader className={cn('w-10', 'h-10', 'text-primary')} />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn('text-[11px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest')}
          >
            Loading ticket…
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={cn('min-h-screen w-full', 'flex', 'items-center', 'justify-center', 'bg-background', 'p-6')}
      >
        <div className={cn('w-full', 'max-w-sm', 'text-center', 'space-y-6')}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1,
            }}
            className={cn('w-20', 'h-20', 'rounded-[2rem]', 'bg-rose-50', 'border', 'border-rose-100', 'flex', 'items-center', 'justify-center', 'mx-auto')}
          >
            <LuTriangleAlert className={cn('w-10', 'h-10', 'text-rose-500')} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className={cn('text-2xl', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
              Ticket Not Found
            </h2>
            <p className={cn('text-[11px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-2')}>
              {error}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn('flex', 'gap-3', 'justify-center')}
          >
            <button
              onClick={() => router.back()}
              className={cn('flex', 'items-center', 'gap-2', 'px-6', 'py-3', 'border', 'border-border', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:border-foreground', 'transition-all', 'cursor-pointer')}
            >
              <LuArrowLeft className={cn('w-4', 'h-4')} /> Back
            </button>
            <button
              onClick={fetchTicket}
              className={cn('flex', 'items-center', 'gap-2', 'px-6', 'py-3', 'bg-foreground', 'text-background', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'hover:bg-primary', 'hover:text-foreground', 'transition-all', 'cursor-pointer')}
            >
              <LuRefreshCcw className={cn('w-4', 'h-4')} /> Retry
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!ticket) return null;

  const isPending = ticket.status === "registered";
  const isCheckedIn = ticket.status === "checked-in";
  const isCancelled = ticket.status === "cancelled";
  const isStaff = ticket.canCheckIn;
  const eventDate = new Date(ticket.event.eventDate);
  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify/ticket/${ticket.inviteCode}`;

  const STATUS_CONFIG = {
    registered: {
      bg: "bg-emerald-500",
      text: "Valid — Not Yet Scanned",
      dot: "bg-emerald-400",
    },
    "checked-in": {
      bg: "bg-blue-500",
      text: "Checked In",
      dot: "bg-blue-400",
    },
    cancelled: {
      bg: "bg-rose-500",
      text: "Cancelled",
      dot: "bg-rose-400",
    },
  };
  const statusCfg = STATUS_CONFIG[ticket.status];

  return (
    <div
      className={cn(
        "min-h-screen w-full md:mt-[90px]",
        "bg-muted",
        "flex",
        "flex-col",
        "items-center",
        "justify-start",
        "py-8",
        "px-4",
      )}
    >
      {/* ── Check-in error modal ── ADD IT HERE */}
      <AnimatePresence>
        {checkInError && (
          <>
            {/* Backdrop */}
            <motion.div
              key="checkin-error-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckInError(null)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              key="checkin-error-modal"
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{
                type: "spring" as const,
                stiffness: 300,
                damping: 26,
              }}
              className="fixed inset-x-4 bottom-8 z-50 mx-auto max-w-sm"
            >
              <div className="bg-background border-2 border-border rounded-[2rem] p-6 shadow-2xl space-y-4">
                {/* Icon */}
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      checkInError.toLowerCase().includes("ended")
                        ? "bg-rose-50 border border-rose-100"
                        : "bg-amber-50 border border-amber-100",
                    )}
                  >
                    <LuTriangleAlert
                      className={cn(
                        "w-6 h-6",
                        checkInError.toLowerCase().includes("ended")
                          ? "text-rose-500"
                          : "text-amber-500",
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Check-in Unavailable
                    </p>
                    <p className="text-sm font-black text-foreground tracking-tight mt-0.5">
                      {checkInError}
                    </p>
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => setCheckInError(null)}
                  className="w-full py-3 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className={cn("w-full", "max-w-md", "mb-6")}
      >
        <button
          onClick={() => router.back()}
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "text-[10px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
            "hover:text-foreground",
            "transition-colors",
            "cursor-pointer",
          )}
        >
          <LuArrowLeft className={cn("w-4", "h-4")} /> Back
        </button>
      </motion.div>

      {/* Fix 2 & 3: AnimatePresence and LuUser were unused — AnimatePresence
          is now used below to animate the check-in action section */}
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className={cn("w-full", "max-w-md", "space-y-4")}
      >
        {/* ── Staff check-in card ── */}
        {isStaff && ticket.owner && (
          <motion.div
            variants={cardVariants}
            className={cn(
              "bg-background",
              "rounded-[2.5rem]",
              "border-2",
              "border-border",
              "shadow-sm",
              "overflow-hidden",
            )}
          >
            {/* Attendee info */}
            <motion.div
              variants={fadeUp}
              className={cn("p-6", "flex", "items-center", "gap-4")}
            >
              <div
                className={cn(
                  "w-16",
                  "h-16",
                  "rounded-2xl",
                  "bg-muted",
                  "overflow-hidden",
                  "border",
                  "border-border",
                  "flex",
                  "items-center",
                  "justify-center",
                  "text-xl",
                  "font-black",
                  "text-muted-foreground",
                  "shrink-0",
                )}
              >
                {ticket.owner.avatar ? (
                  <Image
                    src={ticket.owner.avatar}
                    alt={ticket.owner.name}
                    width={64}
                    height={64}
                    className={cn("w-full", "h-full", "object-cover")}
                  />
                ) : (
                  <span>{ticket.owner.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-lg",
                    "font-black",
                    "text-foreground",
                    "tracking-tight",
                    "truncate",
                  )}
                >
                  {ticket.owner.name}
                </p>
                <p
                  className={cn(
                    "text-[10px]",
                    "font-bold",
                    "text-muted-foreground",
                    "truncate",
                  )}
                >
                  {ticket.owner.email}
                </p>
                <span
                  className={cn(
                    "mt-1 inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                    ticket.owner.membershipStatus === "active"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600",
                  )}
                >
                  {ticket.owner.membershipStatus}
                </span>
              </div>
            </motion.div>

            {/* Status + action — AnimatePresence handles transitions between states */}
            <div className={cn("p-6", "pt-0")}>
              <AnimatePresence mode="wait">
                {isPending && (
                  <motion.button
                    key="checkin-btn"
                    variants={checkInResultVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={handleCheckIn}
                    disabled={checking || checkInLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "w-full",
                      "flex",
                      "items-center",
                      "justify-center",
                      "gap-3",
                      "py-5",
                      "bg-emerald-500",
                      "text-background",
                      "rounded-2xl",
                      "text-[11px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "hover:bg-emerald-600",
                      "transition-colors",
                      "shadow-xl",
                      "shadow-emerald-500/20",
                      "cursor-pointer",
                      "disabled:opacity-60",
                    )}
                  >
                    {checking ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="inline-block"
                        >
                          <LuLoader className={cn("w-5", "h-5")} />
                        </motion.span>
                        Checking in…
                      </>
                    ) : (
                      <>
                        <LuShieldCheck className={cn("w-5", "h-5")} /> Confirm
                        Entry
                      </>
                    )}
                  </motion.button>
                )}

                {isCheckedIn && (
                  <motion.div
                    key="checked-in-result"
                    variants={checkInResultVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={cn(
                      "w-full",
                      "flex",
                      "items-center",
                      "justify-center",
                      "gap-3",
                      "py-5",
                      "bg-blue-50",
                      "border",
                      "border-blue-100",
                      "rounded-2xl",
                    )}
                  >
                    <LuCircleCheck
                      className={cn("w-5", "h-5", "text-blue-600")}
                    />
                    <div className="text-left">
                      <p
                        className={cn(
                          "text-[11px]",
                          "font-black",
                          "text-blue-700",
                          "uppercase",
                          "tracking-widest",
                        )}
                      >
                        Already Checked In
                      </p>
                      {ticket.checkedInAt && (
                        <p
                          className={cn(
                            "text-[9px]",
                            "font-bold",
                            "text-blue-500",
                            "mt-0.5",
                          )}
                        >
                          at{" "}
                          {new Date(ticket.checkedInAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {isCancelled && (
                  <motion.div
                    key="cancelled-result"
                    variants={checkInResultVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={cn(
                      "w-full",
                      "flex",
                      "items-center",
                      "justify-center",
                      "gap-3",
                      "py-5",
                      "bg-rose-50",
                      "border",
                      "border-rose-100",
                      "rounded-2xl",
                    )}
                  >
                    <LuCircleX className={cn("w-5", "h-5", "text-rose-600")} />
                    <p
                      className={cn(
                        "text-[11px]",
                        "font-black",
                        "text-rose-700",
                        "uppercase",
                        "tracking-widest",
                      )}
                    >
                      Ticket Cancelled — Deny Entry
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── Ticket card ── */}
        <motion.div
          variants={cardVariants}
          className={cn(
            "bg-background",
            "rounded-[2.5rem]",
            "border-2",
            "border-border",
            "shadow-sm",
            "overflow-hidden",
          )}
        >
          {/* Event banner */}
          <motion.div
            variants={fadeUp}
            className={cn("relative", "h-36", "bg-muted", "overflow-hidden")}
          >
            <Image
              src={ticket.event.image}
              alt={ticket.event.title}
              fill
              priority
              className="object-cover"
            />
            <div
              className={cn(
                "absolute",
                "inset-0",
                "bg-gradient-to-t",
                "from-background/80",
                "to-transparent",
              )}
            />
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
              className={cn(
                "absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-background text-[9px] font-black uppercase tracking-widest",
                statusCfg.bg,
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  statusCfg.dot,
                )}
              />
              {statusCfg.text}
            </motion.div>
          </motion.div>

          <div className={cn("p-6", "space-y-6")}>
            {/* Event title + category */}
            <motion.div variants={fadeUp}>
              <p
                className={cn(
                  "text-[9px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                {ticket.event.category}
              </p>
              <h1
                className={cn(
                  "text-xl",
                  "font-black",
                  "text-foreground",
                  "tracking-tight",
                  "mt-1",
                )}
              >
                {ticket.event.title}
              </h1>
            </motion.div>

            {/* Event details grid */}
            <motion.div
              variants={fadeUp}
              className={cn("grid", "grid-cols-2", "gap-3")}
            >
              <InfoPill
                icon={LuCalendar}
                label="Date"
                value={eventDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              />
              <InfoPill
                icon={LuClock}
                label="Time"
                value={eventDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              <InfoPill
                icon={LuMapPin}
                label="Format"
                value={ticket.event.format}
              />
              <InfoPill
                icon={LuTicket}
                label="Ticket"
                value={ticket.ticketType.name}
              />
            </motion.div>

            {/* Perforated divider */}
            <motion.div
              variants={fadeUp}
              className={cn("flex", "items-center", "gap-2")}
            >
              <div
                className={cn(
                  "w-6",
                  "h-6",
                  "rounded-full",
                  "bg-muted",
                  "border-2",
                  "border-border",
                  "-ml-9",
                )}
              />
              <div
                className={cn(
                  "flex-1",
                  "border-t-2",
                  "border-dashed",
                  "border-border",
                )}
              />
              <div
                className={cn(
                  "w-6",
                  "h-6",
                  "rounded-full",
                  "bg-muted",
                  "border-2",
                  "border-border",
                  "-mr-9",
                )}
              />
            </motion.div>

            {/* QR Code — owner only */}
            {!isStaff && (
              <motion.div
                variants={fadeUp}
                className={cn("flex", "flex-col", "items-center", "gap-4")}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.4,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className={cn(
                    "p-5 bg-background rounded-3xl border-2 shadow-inner",
                    isPending
                      ? "border-emerald-200"
                      : isCheckedIn
                        ? "border-blue-200"
                        : "border-rose-200 opacity-50",
                  )}
                >
                  <QRCodeSVG
                    value={qrUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "/logo-mark.png",
                      width: 28,
                      height: 28,
                      excavate: true,
                    }}
                  />
                </motion.div>

                {/* Invite code */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-[9px]",
                      "font-black",
                      "text-muted-foreground",
                      "uppercase",
                      "tracking-widest",
                      "mb-1",
                    )}
                  >
                    Ticket Code
                  </p>
                  <p
                    className={cn(
                      "text-lg",
                      "font-black",
                      "text-foreground",
                      "font-mono",
                      "tracking-widest",
                      "uppercase",
                    )}
                  >
                    {ticket.inviteCode}
                  </p>
                </div>

                <AnimatePresence>
                  {isCancelled && (
                    <motion.div
                      variants={checkInResultVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={cn(
                        "w-full",
                        "p-4",
                        "bg-rose-50",
                        "border",
                        "border-rose-100",
                        "rounded-2xl",
                        "text-center",
                      )}
                    >
                      <p
                        className={cn(
                          "text-[11px]",
                          "font-black",
                          "text-rose-700",
                          "uppercase",
                          "tracking-widest",
                        )}
                      >
                        This ticket has been cancelled
                      </p>
                    </motion.div>
                  )}

                  {isCheckedIn && ticket.checkedInAt && (
                    <motion.div
                      variants={checkInResultVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={cn(
                        "w-full",
                        "p-4",
                        "bg-blue-50",
                        "border",
                        "border-blue-100",
                        "rounded-2xl",
                        "flex",
                        "items-center",
                        "gap-3",
                      )}
                    >
                      <LuCircleCheck
                        className={cn(
                          "w-5",
                          "h-5",
                          "text-blue-600",
                          "shrink-0",
                        )}
                      />
                      <div>
                        <p
                          className={cn(
                            "text-[11px]",
                            "font-black",
                            "text-blue-700",
                            "uppercase",
                            "tracking-widest",
                          )}
                        >
                          Checked In
                        </p>
                        <p
                          className={cn(
                            "text-[9px]",
                            "font-bold",
                            "text-blue-500",
                            "mt-0.5",
                          )}
                        >
                          {new Date(ticket.checkedInAt).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Registration date */}
            <motion.div
              variants={fadeUp}
              className={cn(
                "flex",
                "items-center",
                "justify-between",
                "pt-2",
                "border-t",
                "border-border",
              )}
            >
              <p
                className={cn(
                  "text-[9px]",
                  "font-black",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                Registered
              </p>
              <p className={cn("text-[10px]", "font-bold", "text-foreground")}>
                {new Date(ticket.registeredAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </motion.div>

            {/* Price */}
            {ticket.ticketType.price > 0 && (
              <motion.div
                variants={fadeUp}
                className={cn("flex", "items-center", "justify-between")}
              >
                <p
                  className={cn(
                    "text-[9px]",
                    "font-black",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-widest",
                  )}
                >
                  Paid
                </p>
                <p
                  className={cn("text-[10px]", "font-bold", "text-foreground")}
                >
                  {ticket.ticketType.currency}{" "}
                  {ticket.ticketType.price.toLocaleString()}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Branding footer */}
        <motion.div variants={fadeUp} className={cn("text-center", "pb-4")}>
          <p
            className={cn(
              "text-[9px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-[0.3em]",
            )}
          >
            DIUSCADI · Official Event Ticket
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── InfoPill ─────────────────────────────────────────────────────────────────
const InfoPill: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <div className={cn('flex', 'items-center', 'gap-2.5', 'p-3', 'bg-muted', 'rounded-2xl', 'border', 'border-border')}>
    <Icon className={cn('w-3.5', 'h-3.5', 'text-muted-foreground', 'shrink-0')} />
    <div className="min-w-0">
      <p className={cn('text-[7px]', 'font-black', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'leading-none')}>
        {label}
      </p>
      <p className={cn('text-[10px]', 'font-black', 'text-foreground', 'truncate', 'mt-0.5')}>
        {value}
      </p>
    </div>
  </div>
);
