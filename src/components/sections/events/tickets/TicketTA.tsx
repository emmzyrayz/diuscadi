"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { LuShieldAlert, LuCheck, LuExternalLink, LuInfo } from "react-icons/lu";
import { cn } from "@/lib/utils";

export const TicketTermsAndAgreement = () => {
  const [agreed, setAgreed] = useState(false);

  return (
    <section className={cn('w-full', 'max-w-4xl', 'mx-auto', 'px-4', 'py-8')}>
      <div
        className={cn(
          "bg-white rounded-[2.5rem] p-8 md:p-10 border-2 transition-all duration-300",
          agreed
            ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
            : "border-slate-100 shadow-sm",
        )}
      >
        {/* Header Note */}
        <div className={cn('flex', 'items-start', 'gap-4', 'mb-8')}>
          <div className={cn('p-3', 'bg-blue-50', 'text-blue-600', 'rounded-2xl')}>
            <LuInfo className={cn('w-5', 'h-5')} />
          </div>
          <div className="space-y-1">
            <h3 className={cn('font-black', 'text-slate-900', 'uppercase', 'tracking-tighter', 'text-lg')}>
              Terms of Participation
            </h3>
            <p className={cn('text-sm', 'text-slate-500', 'font-medium')}>
              Please review our ground rules to ensure a productive experience
              for everyone.
            </p>
          </div>
        </div>

        {/* Quick Summary Grid */}
        <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4', 'mb-10')}>
          <div className={cn('p-4', 'bg-slate-50', 'rounded-2xl', 'border', 'border-slate-100', 'flex', 'items-start', 'gap-3')}>
            <LuShieldAlert className={cn('w-4', 'h-4', 'text-slate-400', 'mt-0.5')} />
            <p className={cn('text-[11px]', 'font-bold', 'text-slate-600', 'leading-relaxed')}>
              Tickets are non-transferable and tied to your verified identity.
            </p>
          </div>
          <div className={cn('p-4', 'bg-slate-50', 'rounded-2xl', 'border', 'border-slate-100', 'flex', 'items-start', 'gap-3')}>
            <LuShieldAlert className={cn('w-4', 'h-4', 'text-slate-400', 'mt-0.5')} />
            <p className={cn('text-[11px]', 'font-bold', 'text-slate-600', 'leading-relaxed')}>
              Recording or rebroadcasting of session content is strictly
              prohibited.
            </p>
          </div>
        </div>

        {/* The Action Area */}
        <div className={cn('flex', 'flex-col', 'md:flex-row', 'md:items-center', 'justify-between', 'gap-6', 'pt-6', 'border-t', 'border-slate-100')}>
          <label className={cn('flex', 'items-start', 'gap-4', 'cursor-pointer', 'group', 'max-w-xl')}>
            <div className={cn('relative', 'mt-1')}>
              <input
                type="checkbox"
                className={cn('peer', 'sr-only')}
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
              />
              <div
                className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                  agreed
                    ? "bg-emerald-500 border-emerald-500"
                    : "bg-white border-slate-200 group-hover:border-primary",
                )}
              >
                {agreed && (
                  <LuCheck className={cn('text-white', 'w-4', 'h-4', 'stroke-4')} />
                )}
              </div>
            </div>
            <span className={cn('text-sm', 'font-bold', 'text-slate-700', 'leading-snug')}>
              I have read and agree to the DIUSCADI{" "}
              <a
                href="#"
                className={cn('text-primary', 'hover:underline', 'inline-flex', 'items-center', 'gap-1')}
              >
                Event Terms <LuExternalLink className={cn('w-3', 'h-3')} />
              </a>{" "}
              and{" "}
              <a
                href="#"
                className={cn('text-primary', 'hover:underline', 'inline-flex', 'items-center', 'gap-1')}
              >
                Privacy Policy <LuExternalLink className={cn('w-3', 'h-3')} />
              </a>
              .
            </span>
          </label>

          {!agreed && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn('px-4', 'py-2', 'bg-orange-50', 'text-orange-600', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'rounded-lg', 'flex', 'items-center', 'gap-2')}
            >
              <div className={cn('w-1.5', 'h-1.5', 'bg-orange-600', 'rounded-full', 'animate-pulse')} />
              Required to continue
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
