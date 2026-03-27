"use client";
import React from "react";
import { LuInbox, LuActivity } from "react-icons/lu";

interface Props {
  pendingCount: number;
}

export const APHeader: React.FC<Props> = ({ pendingCount }) => (
  <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center text-secondary shadow-xl shadow-foreground/20">
          <LuInbox className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">
              Applications
            </h1>
            {pendingCount > 0 && (
              <div className="px-3 py-1 bg-amber-100 border border-amber-200 rounded-full flex items-center gap-1.5">
                <LuActivity className="w-3 h-3 text-amber-600" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                  {pendingCount} Pending
                </span>
              </div>
            )}
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Review committee and skills change requests
          </p>
        </div>
      </div>
    </div>
  </div>
);
