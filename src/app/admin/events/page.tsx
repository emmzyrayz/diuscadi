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

const PAGE_SIZE = 10;

// ── Timezone helper (mirrored from AEEditModal) ───────────────────────────────
// Converts an ISO string to a "YYYY-MM-DDTHH:mm" string in WAT (UTC+1)
// so that datetime-local inputs are pre-populated with the correct local time.
function isoToLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000); // shift +1h to WAT
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
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

  // Open edit modal when ?edit=id is in the URL
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
  // All datetime fields come from the DB as ISO strings (UTC).
  // We convert them to WAT "YYYY-MM-DDTHH:mm" strings so that
  // the datetime-local / date / time inputs are correctly pre-filled.
  function buildInitialData(event: AdminEvent) {
    const eventDateWat = event.eventDate
      ? isoToLocalDatetime(event.eventDate)
      : "";
    // "YYYY-MM-DDTHH:mm" → split at T to get date and startTime separately
    const [datePart, timePart] = eventDateWat.split("T");

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
      ticketPrice: (event as unknown as { ticketPrice?: number }).ticketPrice ?? 0,
      // registrationDeadline must be "YYYY-MM-DDTHH:mm" for datetime-local
      registrationDeadline: event.registrationDeadline
        ? isoToLocalDatetime(event.registrationDeadline)
        : "",
      visibility:
        (event as unknown as { status?: string }).status === "published"
          ? ("Public" as const)
          : ("Invite-Only" as const),
    };
  }

  if (loadingAdminEvents && adminEvents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full md:mt-20 mt-10">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full md:mt-20 mt-10 p-6">
      <AdminEventsHeader onMutation={handleMutation} />

      {adminEvents.length === 0 && !loadingAdminEvents ? (
        <AdminEventsEmptyState
          onCreateClick={() =>
            window.dispatchEvent(new CustomEvent("open-create-event"))
          }
        />
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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

      {/* Edit modal — eventId triggers the PATCH path inside the modal */}
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