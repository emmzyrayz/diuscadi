"use client";
import React from "react";
import { LuMail, LuLock, LuGithub } from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";
import { AuthInput } from "./AuthInput";
import Link from "next/link";
import { IconType } from "react-icons";

export const SigninForm: React.FC = () => {
  return (
    <form className="space-y-6 w-full" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-4">
        <AuthInput label="Campus Email" icon={LuMail} type="email" />
        <AuthInput label="Password" icon={LuLock} type="password" />
      </div>

      <div className="flex items-center justify-between px-2">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-200 text-slate-900 focus:ring-0"
          />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
            Remember Me
          </span>
        </label>
        <Link
          href="/auth/forgot-password"
          title="Recover Access"
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10"
      >
        Secure Sign In
      </button>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-100" />
        </div>
        <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 bg-white px-4">
          Or Continue With
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SocialButton icon={FcGoogle} label="Google" />
        <SocialButton icon={LuGithub} label="Github" />
      </div>
    </form>
  );
};

const SocialButton = ({
  icon: Icon,
  label,
}: {
  icon: IconType;
  label: string;
}) => (
  <button
    type="button"
    className="flex items-center justify-center gap-3 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
  >
    <Icon className="w-4 h-4" />
    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
      {label}
    </span>
  </button>
);
