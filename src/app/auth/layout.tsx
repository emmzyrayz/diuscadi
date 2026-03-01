"use client";
import React from "react";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { AuthSidePanel } from "./components/AuthSidePanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left Section: Interaction Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 overflow-hidden">
        {/*
          AnimatePresence enables exit animations when switching between
          /auth, /auth/signup, /auth/forgot-password, etc.
          mode="wait" ensures the exiting card finishes before the new one enters.
        */}
        <AnimatePresence mode="wait" initial={false}>
          <React.Fragment key={pathname}>{children}</React.Fragment>
        </AnimatePresence>
      </div>

      {/* Right Section: Visual & Narrative */}
      <AuthSidePanel />
    </div>
  );
}
