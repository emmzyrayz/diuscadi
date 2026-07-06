"use client";
// src/components/sections/profile/ReferralSection.tsx
// Profile edit tab for setting a referral code retroactively.
// Shows live validation (referrer's name) as user types.
// Once referredBy is set, the section becomes read-only with a lock UI.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  LuShare2,
  LuCheck,
  LuLoader,
  LuLock,
  LuCircleAlert,
  LuX,
  LuUserCheck,
  LuCopy,
} from "react-icons/lu";
import { toast } from "react-hot-toast";

export function ReferralSection() {
  const { token } = useAuth();
  const { profile, refreshProfile } = useUser();

  // ── Invite code display (this user's own code) ────────────────────────────
  const [copiedOwn, setCopiedOwn] = useState(false);

  const handleCopyOwn = () => {
    if (!profile?.signupInviteCode) return;
    navigator.clipboard.writeText(profile.signupInviteCode);
    setCopiedOwn(true);
    setTimeout(() => setCopiedOwn(false), 2000);
  };

  // ── Referral code input (set referredBy) ──────────────────────────────────
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{
    valid: boolean;
    referrerName?: string;
    error?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const alreadySet = !!profile?.referredBy;

  // ── Live validation debounce ───────────────────────────────────────────────

  const validateCode = useCallback(async (value: string) => {
    if (!value.trim()) {
      setValidation(null);
      return;
    }
    setValidating(true);
    try {
      const res = await fetch("/api/referrals/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value.trim() }),
      });
      const data = await res.json();
      setValidation(data);
    } catch {
      setValidation({ valid: false, error: "Validation unavailable" });
    } finally {
      setValidating(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!code.trim()) {
      setValidation(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      validateCode(code);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code, validateCode]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!token || !validation?.valid) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile/set-referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to apply referral code");
        return;
      }

      toast.success(data.message ?? "Referral code applied successfully!");
      await refreshProfile();
      setCode("");
      setValidation(null);
    } catch {
      toast.error("Failed to apply referral code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Your own invite code ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h3 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
            Your Invite Code
          </h3>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
            Share this with others to earn referral points
          </p>
        </div>

        {profile?.signupInviteCode ? (
          <div className={cn('flex', 'items-center', 'gap-3', 'p-4', 'bg-foreground', 'rounded-2xl')}>
            <LuShare2 className={cn('w-5', 'h-5', 'text-primary', 'shrink-0')} />
            <span className={cn('flex-1', 'font-mono', 'text-sm', 'font-black', 'text-background', 'tracking-widest', 'uppercase')}>
              {profile.signupInviteCode}
            </span>
            <button
              onClick={handleCopyOwn}
              className={cn('p-2', 'rounded-xl', 'bg-background/10', 'hover:bg-background/20', 'transition-all', 'text-background')}
            >
              {copiedOwn ? (
                <LuCheck className={cn('w-4', 'h-4', 'text-emerald-400')} />
              ) : (
                <LuCopy className={cn('w-4', 'h-4')} />
              )}
            </button>
          </div>
        ) : (
          <div className={cn('p-4', 'bg-muted', 'rounded-2xl', 'border', 'border-border')}>
            <p className={cn('text-xs', 'text-muted-foreground')}>
              Invite code not yet generated
            </p>
          </div>
        )}

        <p className={cn('text-[10px]', 'text-muted-foreground', 'leading-relaxed')}>
          When someone signs up using your code, you earn referral points. You
          also earn reduced points when your referrals bring in their own
          referrals (up to 3 levels deep).
        </p>
      </div>

      {/* ── Set referredBy ────────────────────────────────────────────────────── */}
      <div className={cn('space-y-4', 'pt-6', 'border-t', 'border-border')}>
        <div>
          <h3 className={cn('text-sm', 'font-black', 'text-foreground', 'uppercase', 'tracking-tight')}>
            Who Referred You?
          </h3>
          <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5')}>
            {alreadySet
              ? "Referral code applied — locked"
              : "Enter the invite code of the person who brought you to DIUSCADI"}
          </p>
        </div>

        {/* Already set — locked read-only state */}
        {alreadySet ? (
          <div className="space-y-3">
            <div className={cn('flex', 'items-center', 'gap-3', 'p-4', 'bg-emerald-500/5', 'border', 'border-emerald-500/20', 'rounded-2xl')}>
              <LuLock className={cn('w-5', 'h-5', 'text-emerald-500', 'shrink-0')} />
              <div className={cn('flex-1', 'min-w-0')}>
                <p className={cn('text-[11px]', 'font-black', 'text-emerald-600')}>
                  Referral code applied
                </p>
                <p className={cn('text-[10px]', 'text-muted-foreground', 'font-mono', 'mt-0.5', 'truncate')}>
                  Code: {profile?.referredBy}
                </p>
              </div>
              <LuCheck className={cn('w-4', 'h-4', 'text-emerald-500', 'shrink-0')} />
            </div>
            <p className={cn('text-[10px]', 'text-muted-foreground', 'leading-relaxed')}>
              Your referral has been recorded and your referrer has received
              their reward points. This cannot be changed.
            </p>
          </div>
        ) : (
          /* Not yet set — input form */
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest')}>
                Referrer&apos;s Invite Code
              </Label>
              <div className="relative">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
                  placeholder="e.g. ABC123XY"
                  disabled={submitting}
                  maxLength={32}
                  className={cn(
                    "text-sm font-mono uppercase tracking-widest pr-10",
                    validation?.valid === true &&
                      "border-emerald-500/50 focus-visible:ring-emerald-500/20",
                    validation?.valid === false &&
                      "border-red-500/50 focus-visible:ring-red-500/20",
                  )}
                />

                {/* Validation state indicator */}
                <div className={cn('absolute', 'right-3', 'top-1/2', '-translate-y-1/2')}>
                  {validating && (
                    <LuLoader className={cn('w-4', 'h-4', 'text-muted-foreground', 'animate-spin')} />
                  )}
                  {!validating && validation?.valid === true && (
                    <LuCheck className={cn('w-4', 'h-4', 'text-emerald-500')} />
                  )}
                  {!validating && validation?.valid === false && code && (
                    <LuX className={cn('w-4', 'h-4', 'text-red-500')} />
                  )}
                </div>
              </div>

              {/* Validation feedback */}
              {validation?.valid === true && validation.referrerName && (
                <div className={cn('flex', 'items-center', 'gap-2', 'text-[11px]', 'text-emerald-600', 'font-bold')}>
                  <LuUserCheck className={cn('w-3.5', 'h-3.5', 'shrink-0')} />
                  Referred by: {validation.referrerName}
                </div>
              )}
              {validation?.valid === false && code && (
                <div className={cn('flex', 'items-center', 'gap-2', 'text-[11px]', 'text-red-500', 'font-bold')}>
                  <LuCircleAlert className={cn('w-3.5', 'h-3.5', 'shrink-0')} />
                  {validation.error ?? "Invalid invite code"}
                </div>
              )}
            </div>

            {/* Warning about immutability */}
            <div className={cn('flex', 'items-start', 'gap-2', 'p-3', 'bg-amber-500/5', 'border', 'border-amber-500/15', 'rounded-xl')}>
              <LuCircleAlert className={cn('w-3.5', 'h-3.5', 'text-amber-500', 'shrink-0', 'mt-0.5')} />
              <p className={cn('text-[10px]', 'text-amber-600', 'leading-relaxed')}>
                This can only be set once and cannot be changed after
                submission. Make sure you have the correct code before
                confirming.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !validation?.valid || !code.trim()}
              className={cn('w-full', 'text-[11px]', 'font-black', 'uppercase', 'tracking-widest')}
            >
              {submitting ? (
                <>
                  <LuLoader className={cn('w-3.5', 'h-3.5', 'mr-2', 'animate-spin')} />
                  Applying…
                </>
              ) : (
                <>
                  <LuCheck className={cn('w-3.5', 'h-3.5', 'mr-2')} />
                  Apply Referral Code
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
