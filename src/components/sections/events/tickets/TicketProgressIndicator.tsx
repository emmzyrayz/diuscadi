"use client";
import React from "react";
import { LuCheck, LuUser, LuTicket, LuShieldCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3;
  isSignedIn: boolean;
}

export const TicketProgressIndicator = ({
  currentStep = 2,
  isSignedIn = true,
}: ProgressIndicatorProps) => {
  const steps = [
    {
      id: 1,
      label: "Sign In",
      icon: <LuUser className={cn('w-5', 'h-5')} />,
      isCompleted: isSignedIn || currentStep > 1,
    },
    {
      id: 2,
      label: "Ticket Info",
      icon: <LuTicket className={cn('w-5', 'h-5')} />,
      isCompleted: currentStep > 2,
    },
    {
      id: 3,
      label: "Confirm",
      icon: <LuShieldCheck className={cn('w-5', 'h-5')} />,
      isCompleted: currentStep > 3,
    },
  ];

  return (
    <section className={cn('w-full', 'py-12', 'bg-white')}>
      <div className={cn('max-w-4xl', 'mx-auto', 'px-4')}>
        <div className={cn('relative', 'flex', 'items-center', 'justify-between')}>
          {/* Background Connector Line */}
          <div className={cn('absolute', 'left-0', 'top-1/2', '-translate-y-1/2', 'w-full', 'h-1', 'bg-slate-100', 'z-0', 'rounded-full')} />

          {/* Active Progress Line */}
          <div
            className={cn('absolute', 'left-0', 'top-1/2', '-translate-y-1/2', 'h-1', 'bg-primary', 'z-0', 'transition-all', 'duration-700', 'ease-in-out', 'rounded-full')}
            style={{
              width:
                currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
            }}
          />

          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isDone = step.isCompleted;

            return (
              <div
                key={step.id}
                className={cn('relative', 'z-10', 'flex', 'flex-col', 'items-center')}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-4",
                    isDone
                      ? "bg-primary border-primary text-white"
                      : isActive
                        ? "bg-white border-primary text-primary shadow-lg shadow-primary/20 scale-110"
                        : "bg-white border-slate-100 text-slate-300",
                  )}
                >
                  {isDone ? (
                    <LuCheck className={cn('w-6', 'h-6', 'stroke-3')} />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Step Label */}
                <div className={cn('absolute', '-bottom-8', 'whitespace-nowrap')}>
                  <span
                    className={cn(
                      "text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors duration-300",
                      isActive
                        ? "text-primary"
                        : isDone
                          ? "text-slate-900"
                          : "text-slate-400",
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Status indicator for mobile */}
                {isActive && (
                  <div className={cn('absolute', '-top-6')}>
                    <span className={cn('bg-primary/10', 'text-primary', 'text-[8px]', 'font-black', 'px-2', 'py-0.5', 'rounded-md', 'uppercase', 'animate-pulse')}>
                      Current
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
