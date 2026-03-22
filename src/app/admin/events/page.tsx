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

  // startTransition defers the setState calls so React 19 doesn't
  // flag them as synchronous cascades inside an effect body
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

    // Wrap in startTransition to satisfy React 19's no-sync-setState-in-effect rule
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

  if (loadingAdminEvents && adminEvents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full mt-20">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full mt-20 p-6">
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

      <AdminEventModal
        isOpen={editModalOpen}
        onClose={handleEditModalClose}
        onSuccess={() => {
          handleEditModalClose();
          handleMutation();
        }}
        initialData={
          editingEvent
            ? {
                title: editingEvent.title,
                category: editingEvent.category,
                type:
                  editingEvent.format === "virtual"
                    ? "Virtual"
                    : editingEvent.format === "hybrid"
                      ? "Hybrid"
                      : "Physical",
                date: editingEvent.eventDate.split("T")[0],
                registrationDeadline:
                  editingEvent.registrationDeadline.split("T")[0],
                maxCapacity: editingEvent.capacity,
              }
            : undefined
        }
      />
    </div>
  );
}
