"use client";
import React from "react";
import {
  LuDatabase,
  LuServer,
  LuShieldCheck,
  LuZap,
  LuCircleCheck,
} from "react-icons/lu";
import { cn } from "../../../lib/utils";

// 1. TypeScript Interfaces
interface SystemService {
  name: string;
  status: "online" | "degraded" | "offline";
  latency?: string;
  icon: React.ElementType;
}

const SYSTEM_SERVICES: SystemService[] = [
  { name: "Database", status: "online", latency: "12ms", icon: LuDatabase },
  {
    name: "Auth Engine",
    status: "online",
    latency: "8ms",
    icon: LuShieldCheck,
  },
  { name: "Media Storage", status: "online", latency: "45ms", icon: LuServer },
  { name: "API Gateway", status: "online", latency: "5ms", icon: LuZap },
];

export const AdminSystemStatus: React.FC = () => {
  return (
    <div className={cn('bg-slate-900', 'border', 'border-white/10', 'rounded-[2rem]', 'p-6', 'overflow-hidden', 'relative', 'group')}>
      {/* Subtle Scanning Animation Background */}
      <div className={cn('absolute', 'inset-0', 'bg-linear-to-r', 'from-transparent', 'via-primary/5', 'to-transparent', '-translate-x-full', 'group-hover:animate-[shimmer_2s_infinite]', 'pointer-events-none')} />

      <div className={cn('relative', 'z-10')}>
        <div className={cn('flex', 'items-center', 'justify-between', 'mb-6')}>
          <h4 className={cn('text-[10px]', 'font-black', 'text-slate-500', 'uppercase', 'tracking-[0.3em]')}>
            System Infrastructure
          </h4>
          <div className={cn('flex', 'items-center', 'gap-1.5', 'px-2', 'py-1', 'bg-emerald-500/10', 'rounded-md')}>
            <div className={cn('w-1.5', 'h-1.5', 'rounded-full', 'bg-emerald-500', 'animate-pulse')} />
            <span className={cn('text-[8px]', 'font-black', 'text-emerald-500', 'uppercase')}>
              All Systems Nominal
            </span>
          </div>
        </div>

        {/* Status Grid */}
        <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
          {SYSTEM_SERVICES.map((service) => (
            <div
              key={service.name}
              className={cn('flex', 'items-center', 'gap-3', 'p-3', 'bg-white/5', 'rounded-xl', 'border', 'border-white/5', 'hover:border-white/10', 'transition-colors')}
            >
              <div
                className={`p-2 rounded-lg ${
                  service.status === "online"
                    ? "text-primary bg-primary/10"
                    : "text-rose-500 bg-rose-500/10"
                }`}
              >
                <service.icon className={cn('w-4', 'h-4')} />
              </div>
              <div>
                <p className={cn('text-[9px]', 'font-black', 'text-white', 'uppercase', 'tracking-tight')}>
                  {service.name}
                </p>
                <div className={cn('flex', 'items-center', 'gap-2', 'mt-0.5')}>
                  <span className={cn('text-[8px]', 'font-bold', 'text-slate-500', 'uppercase')}>
                    {service.status}
                  </span>
                  <span className={cn('text-[8px]', 'font-mono', 'text-slate-600')}>
                    {service.latency}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
