"use client";
import React from "react";
import { cn } from "@/lib/utils";

const Shimmer = ({ className }: { className?: string }) => (
  <div
    className={cn("text-muted", "animate-pulse", "rounded-2xl", className)}
  />
);

export const TicketPageSkeleton = () => (
  <main className={cn("min-h-screen w-full", "bg-background", "pt-[72px]")}>
    {/* Header skeleton */}
    <div
      className={cn("border-b", "border-border", "pt-12", "pb-8", "px-4")}
    >
      <div className={cn("max-w-7xl", "mx-auto", "space-y-3")}>
        <Shimmer className={cn("h-4", "w-32")} />
        <Shimmer className={cn("h-12", "w-56")} />
        <Shimmer className={cn("h-4", "w-80")} />
      </div>
    </div>

    {/* Stats skeleton */}
    <div className={cn("max-w-7xl", "mx-auto", "px-4", "py-8")}>
      <div className={cn("grid", "grid-cols-2", "lg:grid-cols-4", "gap-4")}>
        {[...Array(4)].map((_, i) => (
          <Shimmer key={i} className={cn("h-40", "rounded-[2rem]")} />
        ))}
      </div>
    </div>

    {/* Filter bar skeleton */}
    <div className={cn("border-y", "border-border", "py-4", "px-4")}>
      <div className={cn("max-w-7xl", "mx-auto", "space-y-3")}>
        <Shimmer className={cn("h-12", "w-full")} />
        <Shimmer className={cn("h-10", "w-80")} />
      </div>
    </div>

    {/* Card skeletons */}
    <div className={cn("max-w-7xl", "mx-auto", "px-4", "py-8", "space-y-6")}>
      {[...Array(3)].map((_, i) => (
        <Shimmer key={i} className={cn("h-48", "rounded-[2.5rem]")} />
      ))}
    </div>
  </main>
);
