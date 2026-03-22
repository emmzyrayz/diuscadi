"use client";
// AdminSystemStatus.tsx
// Polls GET /api/admin/status (admin/webmaster-protected) to show real service health.
// Refreshes every 60 seconds automatically.

import React, { useEffect, useState, useCallback } from "react";
import {
  LuDatabase,
  LuServer,
  LuShieldCheck,
  LuZap,
  LuRefreshCw,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface ServiceStatus {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

interface StatusResponse {
  allOk: boolean;
  checkedAt: string;
  services: {
    mongodb: ServiceStatus;
    smtp: ServiceStatus;
    cloudinary: ServiceStatus;
    api: ServiceStatus;
  };
}

const SERVICE_CONFIG = [
  { key: "mongodb" as const, label: "Database", icon: LuDatabase },
  { key: "smtp" as const, label: "Auth / Email", icon: LuShieldCheck },
  { key: "cloudinary" as const, label: "Media CDN", icon: LuServer },
  { key: "api" as const, label: "API Gateway", icon: LuZap },
];

export const AdminSystemStatus: React.FC = () => {
  const { token } = useAuth();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: StatusResponse = await res.json();
        setStatus(data);
        setCheckedAt(
          new Date(data.checkedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
    } catch {
      // silently fail — dashboard should not crash if health check fails
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const allOk = status?.allOk ?? null;

  return (
    <div
      className={cn(
        "bg-foreground",
        "border",
        "border-background/10",
        "rounded-[2rem]",
        "p-6",
        "overflow-hidden",
        "relative",
      )}
    >
      <div className={cn("relative", "z-10")}>
        <div className={cn("flex", "items-center", "justify-between", "mb-6")}>
          <h4
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-[0.3em]",
            )}
          >
            System Infrastructure
          </h4>
          <div className={cn("flex", "items-center", "gap-2")}>
            {checkedAt && (
              <span
                className={cn(
                  "text-[8px]",
                  "font-bold",
                  "text-muted-foreground",
                  "uppercase",
                )}
              >
                {checkedAt}
              </span>
            )}
            <button
              onClick={fetchStatus}
              disabled={loading}
              className={cn(
                "p-1",
                "rounded-md",
                "bg-background/10",
                "hover:bg-background/20",
                "transition-colors",
                "cursor-pointer",
                "disabled:opacity-50",
              )}
            >
              <LuRefreshCw
                className={cn(
                  "w-3",
                  "h-3",
                  "text-muted-foreground",
                  loading ? "animate-spin" : "",
                )}
              />
            </button>
            {allOk !== null ? (
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-1.5",
                  "px-2",
                  "py-1",
                  "rounded-md",
                  allOk ? "bg-emerald-500/10" : "bg-rose-500/10",
                )}
              >
                <div
                  className={cn(
                    "w-1.5",
                    "h-1.5",
                    "rounded-full",
                    allOk ? "bg-emerald-500 animate-pulse" : "bg-rose-500",
                  )}
                />
                <span
                  className={cn(
                    "text-[8px]",
                    "font-black",
                    "uppercase",
                    allOk ? "text-emerald-500" : "text-rose-400",
                  )}
                >
                  {allOk ? "All Systems OK" : "Degraded"}
                </span>
              </div>
            ) : (
              <div
                className={cn(
                  "flex",
                  "items-center",
                  "gap-1.5",
                  "px-2",
                  "py-1",
                  "bg-muted/10",
                  "rounded-md",
                )}
              >
                <span
                  className={cn(
                    "text-[8px]",
                    "font-black",
                    "text-muted-foreground",
                    "uppercase",
                  )}
                >
                  Unknown
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={cn("grid", "grid-cols-2", "gap-4")}>
          {SERVICE_CONFIG.map(({ key, label, icon: Icon }) => {
            const svc = status?.services[key];
            const isOk = svc?.ok ?? null;
            const latency = svc?.latencyMs;

            return (
              <div
                key={key}
                className={cn(
                  "flex",
                  "items-center",
                  "gap-3",
                  "p-3",
                  "bg-background/5",
                  "rounded-xl",
                  "border",
                  "border-background/5",
                  "hover:border-background/10",
                  "transition-colors",
                )}
              >
                <div
                  className={cn(
                    "p-2",
                    "rounded-lg",
                    isOk === true
                      ? "text-primary bg-primary/10"
                      : isOk === false
                        ? "text-rose-500 bg-rose-500/10"
                        : "text-muted-foreground bg-muted/10",
                  )}
                >
                  <Icon className={cn("w-4", "h-4")} />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[9px]",
                      "font-black",
                      "text-background",
                      "uppercase",
                      "tracking-tight",
                    )}
                  >
                    {label}
                  </p>
                  <p
                    className={cn(
                      "text-[8px]",
                      "font-bold",
                      "uppercase",
                      isOk === true
                        ? "text-emerald-400"
                        : isOk === false
                          ? "text-rose-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {loading && isOk === null
                      ? "checking…"
                      : isOk === true
                        ? latency
                          ? `${latency}ms`
                          : "online"
                        : isOk === false
                          ? (svc?.error ?? "error")
                          : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
