"use client";
import React from "react";
import Link from "next/link";
import { LuHexagon } from "react-icons/lu";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  linkText?: string;
  linkHref?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  linkText,
  linkHref,
}) => {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* 1. Platform Logo (Identity) */}
      <Link
        href="/"
        className="group transition-transform hover:scale-110 active:scale-95"
      >
        <div className="w-16 h-16 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-secondary shadow-2xl shadow-slate-900/20 border border-white/10 relative">
          <LuHexagon className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
          {/* Decorative pulse for "Live" feel */}
          <div className="absolute inset-0 rounded-[1.25rem] border border-primary/20 animate-ping opacity-20" />
        </div>
      </Link>

      {/* 2. Dynamic Narrative */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
          {title}
        </h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {subtitle}
        </p>
      </div>

      {/* 3. Toggle Link (Optional) */}
      {linkText && linkHref && (
        <div className="pt-2">
          <Link
            href={linkHref}
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-slate-900 transition-colors border-b-2 border-primary/20 hover:border-slate-900 pb-0.5"
          >
            {linkText}
          </Link>
        </div>
      )}
    </div>
  );
};
