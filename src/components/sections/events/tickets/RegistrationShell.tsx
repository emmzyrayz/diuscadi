"use client";
// context/EventContext — RegistrationShell
// Owns all interactive state for the registration flow.
// Server page passes event + user as props.

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useEvents } from "@/context/EventContext";
import { cn } from "@/lib/utils";

import { TicketEventSummary } from "./TicketSummary";
import { TicketProgressIndicator } from "./TicketProgressIndicator";
import { TicketUserVerificationCard } from "./TicketUserVerificationCard";
import { TicketFormSection } from "./TicketForm";
import { TicketPreviewCard } from "./TicketPreview";
import { TicketTermsAndAgreement } from "./TicketTA";
import { TicketSubmitSection } from "./TicketSubmit";
import { TicketHelpSection } from "./TicketHelp";

import type {
  RegisterEventData,
  RegisterUserData,
} from "@/app/events/[slug]/register/page";

interface Props {
  event: RegisterEventData;
  user: RegisterUserData;
}

export const RegistrationShell = ({ event, user }: Props) => {
  const router = useRouter();
  const { registerForEvent } = useEvents();

  const [agreed, setAgreed] = useState(false);
  const [attendanceType, setAttendanceType] = useState<"physical" | "virtual">(
    "physical",
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    event.ticketTypes[0]?.id ?? "",
  );
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedTicket =
    event.ticketTypes.find((t) => t.id === selectedTicketId) ??
    event.ticketTypes[0];

  const handleSubmit = async () => {
    if (!agreed || status !== "idle") return;

    setStatus("loading");
    setErrorMsg("");

    const result = await registerForEvent(event.id, selectedTicket?.id ?? "");

    if (result.success) {
      setStatus("success");
      // Brief pause so the user sees the success state, then go to tickets
      setTimeout(() => router.push("/tickets"), 2000);
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Registration failed. Please try again.");
    }
  };

  return (
    <>
      <TicketEventSummary event={event} />

      <div
        className={cn(
          "max-w-7xl",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-10",
        )}
      >
        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "lg:grid-cols-12",
            "gap-8",
            "items-start",
          )}
        >
          {/* ── LEFT: Form Column ── */}
          <div
            className={cn(
              "lg:col-span-7",
              "xl:col-span-8",
              "space-y-6",
              "md:space-y-8",
            )}
          >
            <TicketProgressIndicator currentStep={2} isSignedIn={true} />

            {/* User verification — mobile only */}
            <div className={cn("block", "lg:hidden")}>
              <TicketUserVerificationCard user={user} />
            </div>

            <TicketFormSection
              user={user}
              ticketTypes={event.ticketTypes}
              selectedTicketId={selectedTicketId}
              onTicketSelect={setSelectedTicketId}
              attendanceType={attendanceType}
              onAttendanceChange={setAttendanceType}
              format={event.format}
            />

            {/* Ticket preview — mobile only */}
            <div className={cn("block", "lg:hidden")}>
              <TicketPreviewCard
                user={user}
                event={event}
                attendanceType={attendanceType}
              />
            </div>

            <TicketTermsAndAgreement
              agreed={agreed}
              onAgreeChange={setAgreed}
            />

            {errorMsg && (
              <p
                className={cn(
                  "px-4",
                  "py-3",
                  "bg-red-50",
                  "text-red-600",
                  "text-sm",
                  "font-bold",
                  "rounded-2xl",
                  "border",
                  "border-red-100",
                )}
              >
                {errorMsg}
              </p>
            )}

            <TicketSubmitSection
              price={selectedTicket?.label ?? event.price}
              agreed={agreed}
              status={status}
              onSubmit={handleSubmit}
            />
          </div>

          {/* ── RIGHT: Sticky Sidebar ── */}
          <div
            className={cn(
              "hidden",
              "lg:block",
              "lg:col-span-5",
              "xl:col-span-4",
              "sticky",
              "top-24",
              "space-y-8",
            )}
          >
            <TicketUserVerificationCard user={user} />
            <TicketPreviewCard
              user={user}
              event={event}
              attendanceType={attendanceType}
            />
          </div>
        </div>

        <div className={cn("mt-12", "border-t", "border-border", "pt-12")}>
          <TicketHelpSection />
        </div>
      </div>
    </>
  );
};
