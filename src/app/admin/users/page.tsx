"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { AdminUsersHeader } from "@/components/sections/admin/users/AUHeader";
import { AdminUsersToolbar } from "@/components/sections/admin/users/AUToolbar";
import {
  AdminUsersTable,
  UserRowData,
} from "@/components/sections/admin/users/AUTable";
import { AdminUsersPagination } from "@/components/sections/admin/users/AUPagination";
import { AdminUsersEmptyState } from "@/components/sections/admin/users/AUEmptyState";
import { AdminUserDetailsModal } from "@/components/sections/admin/users/modal/AUDetailModal";

export default function UsersManagementPage() {
  // 1. Page State
  const [hasUsers] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRowData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // 2. Handlers
  const handleViewUser = (user: UserRowData) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
    };
    
    const handleCloseDetails = () => {
      setIsDetailsOpen(false);
      // Optional: Clear selected user after modal animation completes
      setTimeout(() => setSelectedUser(null), 300);
    };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="max-w-[1600px] w-full mt-20 p-3 mx-auto space-y-8"
    >
      {/* SECTION 1: Header (Identity & Stats) */}
      <AdminUsersHeader
        totalUsers={1248}
        onExport={() => console.log("Exporting CSV...")}
        onImport={() => console.log("Opening Import Wizard...")}
      />

      {/* SECTION 2: Toolbar (Precision Filters) */}
      <AdminUsersToolbar />

      {/* SECTION 3: Main Data View */}
      {hasUsers ? (
        <div className="space-y-6">
          <AdminUsersTable onViewDetails={handleViewUser} />

          {/* SECTION 4: Pagination */}
          <AdminUsersPagination
            currentPage={1}
            totalPages={12}
            totalUsers={1248}
            pageSize={10}
            onPageChange={(p) => console.log(`Navigating to page ${p}`)}
          />
        </div>
      ) : (
        <AdminUsersEmptyState
          isSearchActive={isSearchActive}
          onClearFilters={() => setIsSearchActive(false)}
        />
      )}

      {/* SECTION 5: Contextual Modals */}
      {selectedUser && (
        <AdminUserDetailsModal
          isOpen={isDetailsOpen}
          user={selectedUser}
          onClose={handleCloseDetails}
        />
      )}
    </motion.div>
  );
}
