"use client";
import React, { useState } from "react";
import { AdminEventsHeader } from "@/components/sections/admin/events/AEHeader";
import { AdminEventsToolbar } from "@/components/sections/admin/events/AEToolbar";
import { AdminEventsTable } from "@/components/sections/admin/events/AETable";
import { AdminEventsPagination } from "@/components/sections/admin/events/AEPagination";
import { AdminEventsEmptyState } from "@/components/sections/admin/events/AEEmptyState";

export default function EventsManagementPage() {
  const [hasEvents] = useState(true); // Mocking data presence

  return (
    <div className="space-y-6 w-full mt-20 p-6">
      <AdminEventsHeader />

      {hasEvents ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminEventsToolbar />
          <AdminEventsTable />
          <AdminEventsPagination
            currentPage={1}
            totalPages={5}
            totalResults={48}
            pageSize={10}
            onPageChange={(p) => console.log(p)}
          />
        </div>
      ) : (
        <AdminEventsEmptyState
          onCreateClick={() => console.log("Open Modal")}
        />
      )}
    </div>
  );
}
