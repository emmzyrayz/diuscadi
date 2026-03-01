"use client";
import React from "react";
import Link from "next/link";
import { LuLifeBuoy, LuArrowRight } from "react-icons/lu";

interface AuthFooterProps {
  type: "signin" | "signup" | "forgot" | "reset";
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ type }) => {
  const config = {
    signin: {
      text: "New to the ecosystem?",
      linkText: "Create an account",
      href: "/auth/signup",
    },
    signup: {
      text: "Already have an account?",
      linkText: "Sign in to continue",
      // Points to /auth (the root signin page), not /auth/signin
      href: "/auth",
    },
    forgot: {
      text: "Remembered your password?",
      linkText: "Back to login",
      href: "/auth",
    },
    reset: {
      text: "Issue with your reset link?",
      linkText: "Request another",
      href: "/auth/forgot-password",
    },
  };

  const active = config[type];

  return (
    <div className="flex flex-col items-center gap-8 mt-4">
      {/* 1. Primary Toggle Action */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {active.text}
        </span>
        <Link
          href={active.href}
          className="group flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-primary transition-all"
        >
          {active.linkText}
          <LuArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* 2. Secondary Support Link */}
      <div className="pt-6 border-t border-slate-50 w-full flex justify-center">
        <button className="flex items-center gap-2 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-slate-500 transition-colors">
          <LuLifeBuoy className="w-3 h-3" />
          System Support &amp; FAQ
        </button>
      </div>
    </div>
  );
};
