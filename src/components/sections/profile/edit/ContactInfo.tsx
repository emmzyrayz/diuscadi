"use client";
// components/sections/profile/edit/ContactInfo.tsx

import React, { useState, useMemo } from "react";
import {
  LuMail,
  LuPhone,
  LuGlobe,
  LuMapPin,
  LuLock,
  LuContact,
  LuTriangleAlert,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import type { UserLocation } from "@/context/UserContext";
import {
  COUNTRIES,
  NIGERIA_STATES,
  NIGERIA_CITIES,
} from "@/assets/data/nigeriaLocations";
import { toast } from "react-hot-toast";

const OTHER = "__other__";

const inputBase =
  "w-full border-2 border-border rounded-2xl py-4 text-sm font-bold outline-none focus:border-primary/40 focus:bg-background transition-all bg-muted text-foreground";
const inputWithIcon = inputBase + " pl-12 pr-6";
const inputNoIcon = inputBase + " px-6";
const selectBase = inputBase + " appearance-none cursor-pointer";
const selectWithIcon = selectBase + " pl-12 pr-6";
const selectNoIcon = selectBase + " px-6";
const readonlyStyle =
  "w-full border-2 border-border rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-muted-foreground cursor-not-allowed bg-muted";

interface LocationFormState {
  country: string;
  state: string;
  city: string;
  customCountry: string;
  customState: string;
  customCity: string;
}

function parseLocation(loc: UserLocation | undefined): LocationFormState {
  if (!loc)
    return {
      country: "",
      state: "",
      city: "",
      customCountry: "",
      customState: "",
      customCity: "",
    };

  const knownCountry = loc.country ? COUNTRIES.includes(loc.country) : false;
  const country = knownCountry ? (loc.country ?? "") : loc.country ? OTHER : "";
  const customCountry = !knownCountry && loc.country ? loc.country : "";

  const knownState = loc.state ? NIGERIA_STATES.includes(loc.state) : false;
  const state = knownState ? (loc.state ?? "") : loc.state ? OTHER : "";
  const customState = !knownState && loc.state ? loc.state : "";

  const cityList =
    knownState && loc.state ? (NIGERIA_CITIES[loc.state] ?? []) : [];
  const knownCity = loc.city ? cityList.includes(loc.city) : false;
  const city = knownCity ? (loc.city ?? "") : loc.city ? OTHER : "";
  const customCity = !knownCity && loc.city ? loc.city : "";

  return { country, state, city, customCountry, customState, customCity };
}

function locationKey(loc: UserLocation | undefined): string {
  if (!loc) return "empty";
  return (
    [loc.country, loc.state, loc.city].filter(Boolean).join("|") || "empty"
  );
}

// ── Inner form — re-mounted via key when saved location changes ───────────────
// useState(initialForm) runs at mount time, so no setState-in-effect needed.
function LocationFields({
  initialForm,
  onSave,
}: {
  initialForm: LocationFormState;
  onSave: (
    payload: UserLocation,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [form, setForm] = useState<LocationFormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const patch = (partial: Partial<LocationFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  };

  const { country, state, city, customCountry, customState, customCity } = form;
  const isNigeria = country === "Nigeria";
  const isOtherCountry = country === OTHER;
  const isOtherState = state === OTHER;
  const isOtherCity = city === OTHER;
  const stateOptions = isNigeria ? NIGERIA_STATES : [];
  const cityOptions =
    isNigeria && state && state !== OTHER ? (NIGERIA_CITIES[state] ?? []) : [];
  const isPendingVerif = isOtherCountry || isOtherState || isOtherCity;

  const resolvedCountry = isOtherCountry ? customCountry.trim() : country;
  const resolvedState = isOtherState ? customState.trim() : state;
  const resolvedCity = isOtherCity ? customCity.trim() : city;

  const handleSave = async () => {
    if (!dirty) return;
    if (isOtherCountry && !customCountry.trim()) {
      toast.error("Please enter your country");
      return;
    }
    if (isOtherState && !customState.trim()) {
      toast.error("Please enter your state");
      return;
    }
    setSaving(true);
    const payload: UserLocation = {
      country: resolvedCountry || undefined,
      state: resolvedState || undefined,
      city: resolvedCity || undefined,
      pendingVerification: isPendingVerif || undefined,
      ...(isPendingVerif
        ? {
            rawCountry: isOtherCountry ? customCountry.trim() : undefined,
            rawState: isOtherState ? customState.trim() : undefined,
            rawCity: isOtherCity ? customCity.trim() : undefined,
          }
        : {}),
    };
    const result = await onSave(payload);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save location");
      return;
    }
    toast.success(
      isPendingVerif
        ? "Location saved — pending admin verification"
        : "Location saved",
    );
    setDirty(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 mt-8">
        {/* Country */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
            Country
          </label>
          <div className="relative">
            <LuGlobe className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none z-10" />
            <select
              value={country}
              onChange={(e) =>
                patch({
                  country: e.target.value,
                  state: "",
                  city: "",
                  customCountry: "",
                  customState: "",
                  customCity: "",
                })
              }
              className={selectWithIcon}
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={OTHER}>Other (specify below)</option>
            </select>
          </div>
          {isOtherCountry && (
            <input
              value={customCountry}
              onChange={(e) => patch({ customCountry: e.target.value })}
              placeholder="Type your country…"
              className={inputNoIcon + " mt-2"}
            />
          )}
        </div>

        {/* State */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
            State / Region
          </label>
          {isNigeria ? (
            <>
              <div className="relative">
                <LuMapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none z-10" />
                <select
                  value={state}
                  onChange={(e) =>
                    patch({ state: e.target.value, city: "", customState: "" })
                  }
                  className={selectWithIcon}
                >
                  <option value="">Select state…</option>
                  {stateOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value={OTHER}>Other (specify below)</option>
                </select>
              </div>
              {isOtherState && (
                <input
                  value={customState}
                  onChange={(e) => patch({ customState: e.target.value })}
                  placeholder="Type your state…"
                  className={inputNoIcon + " mt-2"}
                />
              )}
            </>
          ) : (
            <div className="relative">
              <LuMapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none z-10" />
              <input
                value={state}
                onChange={(e) => patch({ state: e.target.value })}
                placeholder="State / Region / Province"
                className={inputWithIcon}
              />
            </div>
          )}
        </div>

        {/* City / LGA */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
            City / LGA
          </label>
          {isNigeria && cityOptions.length > 0 ? (
            <>
              <select
                value={city}
                onChange={(e) =>
                  patch({ city: e.target.value, customCity: "" })
                }
                className={selectNoIcon}
              >
                <option value="">Select city / LGA…</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={OTHER}>Other (specify below)</option>
              </select>
              {isOtherCity && (
                <input
                  value={customCity}
                  onChange={(e) => patch({ customCity: e.target.value })}
                  placeholder="Type your city or LGA…"
                  className={inputNoIcon + " mt-2"}
                />
              )}
            </>
          ) : (
            <input
              value={isOtherCity ? customCity : city}
              onChange={(e) => patch({ city: e.target.value })}
              placeholder="City / LGA"
              className={inputNoIcon}
            />
          )}
        </div>

        {/* Pending verification notice */}
        {isPendingVerif && dirty && (
          <div className="md:col-span-2 flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <LuTriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-amber-700">
              Your custom location will be flagged for admin verification. Once
              approved it will be added to the standard list.
            </p>
          </div>
        )}
      </div>

      {dirty && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "px-8 py-3 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest",
              "hover:bg-primary hover:text-foreground transition-all cursor-pointer disabled:opacity-60",
            )}
          >
            {saving ? "Saving…" : "Save Location"}
          </button>
        </div>
      )}
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export const ContactInfoSection = () => {
  const { profile, updateProfile } = useUser();

  const email = profile?.email ?? "";
  const phone = profile?.phone
    ? `+${profile.phone.countryCode} ${profile.phone.phoneNumber}`
    : "";

  // Recompute initial form only when the saved location identity changes.
  const initialForm = useMemo(
    () => parseLocation(profile?.location),
    [profile?.location],
  );

  const handleSave = (payload: UserLocation) =>
    updateProfile({ location: payload });

  return (
    <section className="bg-background border-2 border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm transition-all hover:border-primary/20">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary border border-border">
          <LuContact className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground tracking-tight">
            Contact Information
          </h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Communication & Residency details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        {/* Email — read-only */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
            Email Address <LuLock className="w-2.5 h-2.5" />
          </label>
          <div className="relative">
            <LuMail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="email"
              value={email}
              readOnly
              className={readonlyStyle}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-background px-2 py-1 rounded-md text-[8px] font-black text-emerald-600 uppercase border border-emerald-100">
              Verified
            </div>
          </div>
        </div>

        {/* Phone — read-only */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
            Phone Number <LuLock className="w-2.5 h-2.5" />
          </label>
          <div className="relative">
            <LuPhone className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="tel"
              value={phone}
              readOnly
              placeholder="Not set"
              className={readonlyStyle}
            />
          </div>
        </div>
      </div>

      {/* Location fields — key resets the inner component when saved data changes */}
      <LocationFields
        key={locationKey(profile?.location)}
        initialForm={initialForm}
        onSave={handleSave}
      />
    </section>
  );
};
