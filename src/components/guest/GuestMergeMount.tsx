"use client";
// GuestMergeMount.tsx — thin client-side bridge between AuthContext and
// GuestMergePopup. Exists only because RootLayout (app/layout.tsx) is a
// server component and can't call useAuth() directly.

import React from "react";
import { useAuth } from "@/context/AuthContext";
import GuestMergePopup from "@/components/guest/guestMergePopup";

export default function GuestMergeMount() {
  const { guestMergeInfo, clearGuestMergeInfo, token } = useAuth();

  if (!guestMergeInfo || !token) return null;

  return (
    <GuestMergePopup
      info={guestMergeInfo}
      authHeaders={() => ({ Authorization: `Bearer ${token}` })}
      onDismiss={clearGuestMergeInfo}
    />
  );
}
