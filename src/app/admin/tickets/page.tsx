"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { AdminTicketsHeader } from "@/components/sections/admin/tickets/ATHeader";
import { AdminTicketsStats } from "@/components/sections/admin/tickets/ATStats";
import { AdminTicketsToolbar } from "@/components/sections/admin/tickets/ATToolbar";
import { AdminTicketsTable } from "@/components/sections/admin/tickets/ATTable";
import { AdminTicketsPagination } from "@/components/sections/admin/tickets/ATPagination";
import { AdminTicketsEmptyState } from "@/components/sections/admin/tickets/ATEmptyState";
import { TicketScannerModal } from "@/components/sections/admin/tickets/modal/TicketScannerModal";

export default function TicketManagementPage() {
  // 1. Core State
  const [hasTickets] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const handleSearchChange = (searchValue: string) => {
    setIsSearchActive(searchValue.length > 0);
  };

  const handlePageChange = (page: number) => {
    console.log(`Moving to page ${page}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="max-w-[1600px] w-full mt-20 p-5 mx-auto space-y-8"
    >
      {/* SECTION 1: Header & Primary CTA */}
      <AdminTicketsHeader
        activeTickets={1280}
        onScanClick={() => setIsScannerOpen(true)}
        onExportClick={() => console.log("Exporting Manifest...")}
      />

      {/* SECTION 2: Real-time Entry Metrics */}
      <AdminTicketsStats />

      {/* SECTION 3: Tactical Search & Filters */}
      <AdminTicketsToolbar onSearchChange={handleSearchChange} />

      {/* SECTION 4: The Master Manifest (Data Grid) */}
      {hasTickets ? (
        <div className="space-y-6">
          <AdminTicketsTable />

          {/* SECTION 5: Navigation */}
          <AdminTicketsPagination
            currentPage={1}
            totalPages={45}
            totalTickets={2500}
            onPageChange={handlePageChange}
          />
        </div>
      ) : (
        <AdminTicketsEmptyState
          isSearchActive={isSearchActive}
          onReset={() => setIsSearchActive(false)}
        />
      )}

      {/* OVERLAY: Scanning Terminal */}
      <TicketScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </motion.div>
  );
}
