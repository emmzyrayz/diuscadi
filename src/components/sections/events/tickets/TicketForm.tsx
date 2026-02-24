"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuLaptop,
  LuMessageSquare,
  LuHeartPulse,
  LuBriefcase,
} from "react-icons/lu";
import { cn } from "@/lib/utils";

interface TicketFormProps {
  user: {
    name: string;
    email: string;
    phone?: string;
  };
}

export const TicketFormSection = ({ user }: TicketFormProps) => {
  const [attendance, setAttendance] = useState<"physical" | "virtual">(
    "physical",
  );

  const inputClasses =
    "w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:border-primary focus:bg-white outline-hidden transition-all placeholder:text-slate-300 placeholder:font-medium";
  const labelClasses =
    "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1";
  const groupClasses =
    "bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 space-y-6";

  return (
    <section className={cn('w-full', 'max-w-4xl', 'mx-auto', 'px-4', 'py-8', 'space-y-8')}>
      {/* 1. Personal Info Group */}
      <div className={groupClasses}>
        <div className={cn('flex', 'items-center', 'gap-3', 'mb-2')}>
          <div className={cn('p-2', 'bg-primary/10', 'text-primary', 'rounded-xl')}>
            <LuUser className={cn('w-5', 'h-5')} />
          </div>
          <h3 className={cn('font-black', 'text-slate-900', 'uppercase', 'tracking-tighter', 'text-lg')}>
            Personal Details
          </h3>
        </div>

        <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6')}>
          <div>
            <label className={labelClasses}>Full Name (Auto-filled)</label>
            <div
              className={cn(
                inputClasses,
                "bg-slate-100/50 text-slate-400 cursor-not-allowed border-dashed flex items-center gap-3",
              )}
            >
              <LuUser className={cn('w-4', 'h-4')} /> {user.name}
            </div>
          </div>
          <div>
            <label className={labelClasses}>Email Address (Auto-filled)</label>
            <div
              className={cn(
                inputClasses,
                "bg-slate-100/50 text-slate-400 cursor-not-allowed border-dashed flex items-center gap-3",
              )}
            >
              <LuMail className={cn('w-4', 'h-4')} /> {user.email}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>WhatsApp / Phone Number</label>
            <div className="relative">
              <LuPhone className={cn('absolute', 'left-5', 'top-1/2', '-translate-y-1/2', 'text-slate-400', 'w-4', 'h-4')} />
              <input
                type="tel"
                placeholder="+234 000 000 0000"
                className={cn(inputClasses, "pl-12")}
                defaultValue={user.phone}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Event Info Group */}
      <div className={groupClasses}>
        <div className={cn('flex', 'items-center', 'gap-3', 'mb-2')}>
          <div className={cn('p-2', 'bg-primary/10', 'text-primary', 'rounded-xl')}>
            <LuMapPin className={cn('w-5', 'h-5')} />
          </div>
          <h3 className={cn('font-black', 'text-slate-900', 'uppercase', 'tracking-tighter', 'text-lg')}>
            Attendance Mode
          </h3>
        </div>

        <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
          <button
            onClick={() => setAttendance("physical")}
            className={cn(
              "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all",
              attendance === "physical"
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                : "border-slate-100 hover:border-slate-200",
            )}
          >
            <LuMapPin
              className={cn(
                "w-6 h-6",
                attendance === "physical" ? "text-primary" : "text-slate-300",
              )}
            />
            <span
              className={cn(
                "font-bold text-sm",
                attendance === "physical" ? "text-slate-900" : "text-slate-400",
              )}
            >
              Physical
            </span>
          </button>
          <button
            onClick={() => setAttendance("virtual")}
            className={cn(
              "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all",
              attendance === "virtual"
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                : "border-slate-100 hover:border-slate-200",
            )}
          >
            <LuLaptop
              className={cn(
                "w-6 h-6",
                attendance === "virtual" ? "text-primary" : "text-slate-300",
              )}
            />
            <span
              className={cn(
                "font-bold text-sm",
                attendance === "virtual" ? "text-slate-900" : "text-slate-400",
              )}
            >
              Virtual
            </span>
          </button>
        </div>

        <div>
          <label className={labelClasses}>
            Special Requests / Dietary Requirements
          </label>
          <div className="relative">
            <LuMessageSquare className={cn('absolute', 'left-5', 'top-5', 'text-slate-400', 'w-4', 'h-4')} />
            <textarea
              rows={3}
              placeholder="E.g. Wheelchair access, vegetarian meal, etc."
              className={cn(inputClasses, "pl-12 pt-4 resize-none")}
            />
          </div>
        </div>
      </div>

      {/* 3. Emergency & Optional Info Group */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-8')}>
        {/* Emergency */}
        <div className={groupClasses}>
          <div className={cn('flex', 'items-center', 'gap-3', 'mb-2')}>
            <LuHeartPulse className={cn('text-primary', 'w-5', 'h-5')} />
            <h3 className={cn('font-black', 'text-slate-900', 'text-sm', 'uppercase')}>
              Emergency Contact
            </h3>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Contact Name"
              className={inputClasses}
            />
            <input
              type="tel"
              placeholder="Contact Phone"
              className={inputClasses}
            />
          </div>
        </div>

        {/* Professional */}
        <div className={groupClasses}>
          <div className={cn('flex', 'items-center', 'gap-3', 'mb-2')}>
            <LuBriefcase className={cn('text-primary', 'w-5', 'h-5')} />
            <h3 className={cn('font-black', 'text-slate-900', 'text-sm', 'uppercase')}>
              Professional Info
            </h3>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Occupation (e.g. Student)"
              className={inputClasses}
            />
            <input
              type="text"
              placeholder="Organization (e.g. UNILAG)"
              className={inputClasses}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
