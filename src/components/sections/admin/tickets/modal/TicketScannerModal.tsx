"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCamera,
  LuKeyboard,
  LuShieldCheck,
  LuCircleCheck,
  LuTriangleAlert,
  LuLoader,
  LuInfo,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type VerifyResult = "idle" | "valid" | "already_used" | "invalid" | "error";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RESULT_CONFIG = {
  valid: { bg: "bg-emerald-500", Icon: LuCircleCheck, label: "Access Granted" },
  already_used: { bg: "bg-amber-500", Icon: LuInfo, label: "Already Used" },
  invalid: {
    bg: "bg-foreground",
    Icon: LuTriangleAlert,
    label: "Invalid Code",
  },
  error: { bg: "bg-rose-600", Icon: LuTriangleAlert, label: "Error" },
} as const;

export const TicketScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyResult>("idle");
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState("");

  const handleClose = () => {
    setCode("");
    setResult("idle");
    setResultMsg("");
    onClose();
  };

  const handleVerify = async () => {
    if (!code.trim() || !token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/events/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult("valid");
        setResultMsg(data.message ?? "Entry confirmed");
        onSuccess?.();
      } else if (res.status === 409) {
        setResult("already_used");
        setResultMsg(data.error ?? "Ticket already used");
      } else {
        setResult("invalid");
        setResultMsg(data.error ?? "Ticket not found");
      }
    } catch {
      setResult("error");
      setResultMsg("Network error — check connection");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Resolve icon to a capitalized variable so it can be used as JSX
  const resultCfg = result !== "idle" ? RESULT_CONFIG[result] : null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-foreground/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-background rounded-[3rem] shadow-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground z-20 cursor-pointer"
        >
          <LuX className="w-6 h-6" />
        </button>

        <div className="p-10 flex flex-col items-center text-center">
          <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-6">
            Validate Entry
          </h3>

          {/* Camera placeholder */}
          <div className="w-full aspect-square bg-foreground rounded-[2.5rem] relative flex items-center justify-center overflow-hidden border-4 border-border mb-4">
            <LuCamera className="w-12 h-12 text-slate-700 animate-pulse" />
            <p className="absolute bottom-10 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
              Camera — Coming Soon
            </p>
          </div>
          <p className="text-[9px] font-bold text-amber-600 mb-6">
            {/* TODO: install @zxing/browser for real QR scanning */}
            Camera scanning requires @zxing/browser — use manual input below
          </p>

          {/* Result banner */}
          <AnimatePresence>
            {resultCfg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "w-full",
                  "p-4",
                  "rounded-2xl",
                  "mb-4",
                  "text-background",
                  "flex",
                  "items-center",
                  "gap-3",
                  resultCfg.bg,
                )}
              >
                {/* Assign icon to capitalized variable before using as JSX */}
                <resultCfg.Icon className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase tracking-widest">
                    {resultCfg.label}
                  </p>
                  <p className="text-[10px] font-bold opacity-80">
                    {resultMsg}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-muted" />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                Manual Entry
              </span>
              <div className="h-px flex-1 bg-muted" />
            </div>

            <div className="relative group">
              <LuKeyboard className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
              <input
                type="text"
                placeholder="Enter Invite or Ticket Code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setResult("idle");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code) handleVerify();
                }}
                className="w-full bg-muted border border-border rounded-2xl py-5 pl-14 pr-6 text-sm font-black uppercase tracking-widest outline-none focus:border-primary transition-all"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || !code.trim()}
              className="w-full py-5 bg-foreground text-background rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <LuLoader className="w-5 h-5 animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  <LuShieldCheck className="w-5 h-5" /> Verify Credentials
                </>
              )}
            </button>

            {result !== "idle" && (
              <button
                onClick={() => {
                  setCode("");
                  setResult("idle");
                  setResultMsg("");
                }}
                className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Scan Another
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
