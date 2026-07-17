// lib/sessionEvents.ts
export const SESSION_EXPIRED_EVENT = "diuscadi:session-expired";

export function signalSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}
