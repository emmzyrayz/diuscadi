import React from "react";
import { getEventById } from "@/assets/data/event";
import { notFound } from "next/navigation";

// Auth State Components
import { AuthRequiredCard } from "@/components/sections/events/tickets/AuthReqCard";
import { CompleteProfilePrompt } from "@/components/sections/events/tickets/CompleteProfile";

// Registration Flow Components
import { TicketEventSummary } from "@/components/sections/events/tickets/TicketSummary";
import { TicketProgressIndicator } from "@/components/sections/events/tickets/TicketProgressIndicator";
import { TicketFormSection } from "@/components/sections/events/tickets/TicketForm";
import { TicketTermsAndAgreement } from "@/components/sections/events/tickets/TicketTA";
import { TicketSubmitSection } from "@/components/sections/events/tickets/TicketSubmit";
import { TicketUserVerificationCard } from "@/components/sections/events/tickets/TicketUserVerificationCard";
import { TicketPreviewCard } from "@/components/sections/events/tickets/TicketPreview";
import { TicketHelpSection } from "@/components/sections/events/tickets/TicketHelp";
import { cn } from "../../../../lib/utils";

// Define auth state type
type AuthState = "unauthenticated" | "incomplete" | "verified";

export default async function RegistrationLayout({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = getEventById(eventId);

  if (!event) notFound();

  // MOCK AUTH STATE LOGIC (Replace with your actual Auth Provider)
  // Use 'as AuthState' or function to get dynamic state
  const authState = getAuthState(); // Better: use a function
  // OR if you want to test different states manually:
  // const authState: AuthState = "verified"; // Change this to test different states

  const mockUser = {
    name: "John Doe",
    email: "johndoe@example.com",
    status: "Professional" as const,
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
  };

  return (
    <main className={cn("min-h-screen", "bg-slate-50/50", "pb-20")}>
      {/* Top Banner: Always Visible */}
      <TicketEventSummary event={event} />

      {/* STATE 1: Not Logged In */}
      {authState === "unauthenticated" && <AuthRequiredCard />}

      {/* STATE 2: Logged In, No Photo */}
      {authState === "incomplete" && <CompleteProfilePrompt />}

      {/* STATE 3: Verified & Ready to Register */}
      {authState === "verified" && (
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
          {/* THE 65/35 GRID */}
          <div
            className={cn(
              "grid",
              "grid-cols-1",
              "lg:grid-cols-12",
              "gap-8",
              "items-start",
            )}
          >
            {/* LEFT COLUMN (65% on Desktop) */}
            <div
              className={cn(
                "lg:col-span-7",
                "xl:col-span-8",
                "space-y-6",
                "md:space-y-8",
              )}
            >
              <TicketProgressIndicator currentStep={2} isSignedIn={true} />

              {/* Mobile Only: User Verification (Appears below Progress on Mobile) */}
              <div className={cn("block", "lg:hidden")}>
                <TicketUserVerificationCard user={mockUser} />
              </div>

              <TicketFormSection user={mockUser} />

              {/* Mobile Only: Ticket Preview (Appears below Form on Mobile) */}
              <div className={cn("block", "lg:hidden")}>
                <TicketPreviewCard
                  user={mockUser}
                  event={event}
                  attendanceType="physical"
                />
              </div>

              <TicketTermsAndAgreement />

              <TicketSubmitSection price={event.price} />
            </div>

            {/* RIGHT COLUMN (35% on Desktop - STICKY) */}
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
              {/* Wrapping in a div with shadow/border to unify the right sidebar */}
              <div className="space-y-8">
                <TicketUserVerificationCard user={mockUser} />
                <TicketPreviewCard
                  user={mockUser}
                  event={event}
                  attendanceType="physical"
                />
              </div>
            </div>
          </div>

          {/* Global Fallback (Outside the Grid) */}
          <div className={cn("mt-12", "border-t", "border-slate-200", "pt-12")}>
            <TicketHelpSection />
          </div>
        </div>
      )}
    </main>
  );
}

// Helper function to simulate auth state (replace with real auth logic)
function getAuthState(): AuthState {
  // TODO: Replace with actual auth logic from your auth provider
  // Example:
  // const session = await getServerSession();
  // if (!session) return "unauthenticated";
  // if (!session.user.avatar) return "incomplete";
  // return "verified";

  // For testing, you can manually return different states:
  return "verified"; // Change to "unauthenticated" or "incomplete" to test
}
