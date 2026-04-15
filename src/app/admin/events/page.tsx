"use client";
import React, { useEffect, useState, useTransition } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventContext";
import { useSearchParams } from "next/navigation";
import { AdminEventsHeader } from "@/components/sections/admin/events/AEHeader";
import { AdminEventsToolbar } from "@/components/sections/admin/events/AEToolbar";
import { AdminEventsTable } from "@/components/sections/admin/events/AETable";
import { AdminEventsPagination } from "@/components/sections/admin/events/AEPagination";
import { AdminEventsEmptyState } from "@/components/sections/admin/events/AEEmptyState";
import { AdminEventModal } from "@/components/sections/admin/events/modals/AEEditModal";
import { LuLoader } from "react-icons/lu";
import type { AdminEvent } from "@/context/AdminContext";
import { cn } from "../../../lib/utils";

const PAGE_SIZE = 10;

// ── Timezone helper (mirrored from AEEditModal) ───────────────────────────────
function isoToLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

export default function EventsManagementPage() {
  const { token } = useAuth();
  const { refreshFeed } = useEvents();
  const searchParams = useSearchParams();
  const {
    adminEvents,
    adminEventsPagination,
    loadingAdminEvents,
    loadAdminEvents,
  } = useAdmin();

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!token) return;
    loadAdminEvents(
      {
        page: currentPage,
        search: search || undefined,
        status: status || undefined,
      },
      token,
    );
  }, [token, currentPage, search, status, loadAdminEvents]);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || adminEvents.length === 0) return;
    const found = adminEvents.find((e) => e.id === editId);
    if (!found) return;
    startTransition(() => {
      setEditingEvent(found);
      setEditModalOpen(true);
    });
  }, [searchParams, adminEvents]);

  const handleMutation = () => {
    if (!token) return;
    loadAdminEvents({ page: currentPage }, token);
    refreshFeed();
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEditingEvent(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    window.history.replaceState({}, "", url.toString());
  };

  // ── Map AdminEvent → EventFormData ─────────────────────────────────────────
  function buildInitialData(event: AdminEvent) {
    const eventDateWat = event.eventDate
      ? isoToLocalDatetime(event.eventDate)
      : "";
    const [datePart, timePart] = eventDateWat.split("T");

    const rawStatus =
      (event as unknown as { status?: string }).status ?? "published";

    // Visibility mapping:
    //   "published"  → "Public"       (live)
    //   "cancelled"  → "Public"       (default so saving republishes it;
    //                                  admin can switch to Invite-Only on Step 5)
    //   "draft"      → "Invite-Only"  (was intentionally hidden)
    const visibility: "Public" | "Invite-Only" =
      rawStatus === "draft" ? "Invite-Only" : "Public";

    return {
      title: event.title ?? "",
      category: event.category ?? "Technology",
      description: (event as unknown as { overview?: string }).overview ?? "",
      date: datePart ?? "",
      startTime: timePart ?? "",
      type:
        event.format === "virtual"
          ? ("Virtual" as const)
          : event.format === "hybrid"
            ? ("Hybrid" as const)
            : ("Physical" as const),
      venueName:
        (event as unknown as { location?: { venue?: string } }).location
          ?.venue ?? "",
      maxCapacity: event.capacity ?? 100,
      ticketPrice:
        (event as unknown as { ticketPrice?: number }).ticketPrice ?? 0,
      registrationDeadline: event.registrationDeadline
        ? isoToLocalDatetime(event.registrationDeadline)
        : "",
      visibility,
      // Passed through to AEEditModal so PublishStep can show a
      // "republishing a cancelled event" callout on Step 5.
      _originalStatus: rawStatus,
    };
  }

  if (loadingAdminEvents && adminEvents.length === 0) {
    return (
      <div className={cn('flex', 'items-center', 'justify-center', 'min-h-[60vh]', 'w-full', 'md:mt-20', 'mt-10')}>
        <LuLoader className={cn('w-8', 'h-8', 'text-primary', 'animate-spin')} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', 'w-full', 'md:mt-20', 'mt-10', 'p-6')}>
      <AdminEventsHeader onMutation={handleMutation} />

      {adminEvents.length === 0 && !loadingAdminEvents ? (
        <AdminEventsEmptyState
          onCreateClick={() =>
            window.dispatchEvent(new CustomEvent("open-create-event"))
          }
        />
      ) : (
        <div className={cn('animate-in', 'fade-in', 'slide-in-from-bottom-4', 'duration-700')}>
          <AdminEventsToolbar
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />
          <AdminEventsTable
            events={adminEvents}
            onMutation={handleMutation}
            onEditRequest={(event) => {
              setEditingEvent(event);
              setEditModalOpen(true);
            }}
          />
          {adminEventsPagination && adminEventsPagination.totalPages > 1 && (
            <AdminEventsPagination
              currentPage={currentPage}
              totalPages={adminEventsPagination.totalPages}
              totalResults={adminEventsPagination.total}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      <AdminEventModal
        isOpen={editModalOpen}
        onClose={handleEditModalClose}
        onSuccess={() => {
          handleEditModalClose();
          handleMutation();
        }}
        eventId={editingEvent?.id}
        initialData={editingEvent ? buildInitialData(editingEvent) : undefined}
      />
    </div>
  );
}