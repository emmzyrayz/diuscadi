"use client";

import React, { useState } from "react";
import { LuShieldCheck, LuQrCode } from "react-icons/lu";
import { TicketScannerModal } from "@/components/sections/admin/tickets/modal/TicketScannerModal";
import { useAuth } from "@/context/AuthContext";

export default function ModConsole() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { user } = useAuth();

  const displayName =
    user?.fullName && typeof user.fullName === "string"
      ? user.fullName
      : (user?.fullName as { firstname?: string })?.firstname;

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-foreground flex items-center justify-center text-secondary shadow-xl shadow-foreground/20 border border-background/10">
          <LuShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
            Entry Scanning
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {displayName ? `Welcome, ${displayName}` : "Moderator Console"}
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-foreground text-background rounded-2xl hover:bg-primary hover:text-foreground transition-all shadow-2xl shadow-foreground/20 cursor-pointer"
        >
          <LuQrCode className="w-5 h-5" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">
            Scan Entry Pass
          </span>
        </button>
      </div>

      <TicketScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
