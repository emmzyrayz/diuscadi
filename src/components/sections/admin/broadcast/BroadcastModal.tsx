"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuX, LuSend, LuEye, LuLoader } from "react-icons/lu";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { AudienceType, BroadcastFilter } from "@/types/broadcast";

interface PreviewRecipient {
  email: string;
  fullName: string;
  userId: string;
}

interface BroadcastModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  token?: string;
}

const AUDIENCE_OPTIONS: {
  id: AudienceType;
  label: string;
  description: string;
}[] = [
  {
    id: "all_accounts",
    label: "All Users",
    description: "Every account on platform",
  },
  {
    id: "verified_members",
    label: "Verified Members",
    description: "Users with approved membership",
  },
  {
    id: "pending_members",
    label: "Pending Members",
    description: "Users awaiting membership approval",
  },
  {
    id: "unverified_accounts",
    label: "Guest Accounts",
    description: "Users without committee membership",
  },
  {
    id: "by_role",
    label: "By Platform Role",
    description: "Filter by admin, moderator, participant",
  },
  {
    id: "by_committee",
    label: "By Committee",
    description: "Members of specific committee",
  },
  {
    id: "by_committee_role",
    label: "By Committee Role",
    description: "Members with specific committee role",
  },
  {
    id: "by_edu_status",
    label: "By Education Status",
    description: "Students or graduates",
  },
];

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  open,
  onClose,
  onSuccess,
  token,
}) => {
  // ── Form state ────────────────────────────────────────────────────────────
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [selectedAudience, setSelectedAudience] =
    useState<AudienceType>("all_accounts");
  const [linkedEventId, setLinkedEventId] = useState("");

  // ── Filter details ────────────────────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState("admin");
  const [selectedCommittee, setSelectedCommittee] = useState("");
  const [selectedCommitteeRole, setSelectedCommitteeRole] = useState("MEMBER");
  const [selectedEduStatus, setSelectedEduStatus] = useState<
    "STUDENT" | "GRADUATE"
  >("STUDENT");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecipients, setPreviewRecipients] = useState<
    PreviewRecipient[]
  >([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ── Get filter object ─────────────────────────────────────────────────────
  const getFilter = (): BroadcastFilter => {
    const base: BroadcastFilter = { audience: selectedAudience };

    if (selectedAudience === "by_role") {
      base.role = selectedRole;
    } else if (selectedAudience === "by_committee") {
      base.committee = selectedCommittee;
    } else if (selectedAudience === "by_committee_role") {
      base.committee = selectedCommittee;
      base.committeeRole = selectedCommitteeRole;
    } else if (selectedAudience === "by_edu_status") {
      base.eduStatus = selectedEduStatus;
    }

    return base;
  };

  // ── Handle preview ────────────────────────────────────────────────────────
  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/admin/broadcast/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filter: getFilter() }),
      });

      if (!res.ok) throw new Error("Failed to load preview");

      const data = await res.json();
      setPreviewRecipients(data.preview ?? []);
      setRecipientCount(data.totalCount);
      setPreviewOpen(true);
    } catch (err) {
      toast.error("Failed to load preview");
      console.error(err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── Handle send ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      toast.error("Subject and content are required");
      return;
    }

    if (recipientCount === 0) {
      toast.error("No recipients match the selected criteria");
      return;
    }

    if (recipientCount > 1000) {
      const confirmed = window.confirm(
        `Send to ${recipientCount} recipients? This action cannot be undone.`,
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      // 1. Create broadcast
      const createRes = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          htmlContent,
          filter: getFilter(),
          linkedEventId: linkedEventId || undefined,
          sendImmediately: true,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to create broadcast");
      const { id: broadcastId } = await createRes.json();

      // 2. Send broadcast
      const sendRes = await fetch("/api/admin/broadcast/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ broadcastId }),
      });

      if (!sendRes.ok) throw new Error("Failed to send broadcast");

      toast.success(`Broadcast sent to ${recipientCount} recipients`);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send broadcast",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto",
              "bg-background border-2 border-border rounded-2xl p-8 shadow-2xl z-50",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">
                📢 Broadcast Message
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            {/* Subject */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Platform Maintenance Update"
                className={cn(
                  "w-full px-4 py-2 border-2 border-border rounded-lg",
                  "focus:outline-none focus:border-primary",
                )}
              />
            </div>

            {/* Content Editor */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">
                Message Content (HTML)
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Enter your message (HTML supported)"
                rows={8}
                className={cn(
                  "w-full px-4 py-2 border-2 border-border rounded-lg",
                  "font-mono text-sm focus:outline-none focus:border-primary",
                )}
              />
            </div>

            {/* Audience Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3">
                Who should receive this?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedAudience(opt.id)}
                    className={cn(
                      "p-3 text-left border-2 rounded-lg transition",
                      selectedAudience === opt.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="font-bold text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter-specific options */}
            {selectedAudience === "by_role" && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-border rounded-lg"
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="participant">Participant</option>
                </select>
              </div>
            )}

            {(["by_committee", "by_committee_role"] as AudienceType[]).includes(
              selectedAudience,
            ) && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2">
                    Committee
                  </label>
                  <input
                    type="text"
                    value={selectedCommittee}
                    onChange={(e) => setSelectedCommittee(e.target.value)}
                    placeholder="e.g., media, sports"
                    className="w-full px-4 py-2 border-2 border-border rounded-lg"
                  />
                </div>

                {selectedAudience === "by_committee_role" && (
                  <div className="mb-6">
                    <label className="block text-sm font-bold mb-2">
                      Committee Role
                    </label>
                    <select
                      value={selectedCommitteeRole}
                      onChange={(e) => setSelectedCommitteeRole(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-border rounded-lg"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="COORDINATOR">Coordinator</option>
                      <option value="HEAD">Head</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {selectedAudience === "by_edu_status" && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">
                  Education Status
                </label>
                <select
                  value={selectedEduStatus}
                  onChange={(e) =>
                    setSelectedEduStatus(
                      e.target.value as "STUDENT" | "GRADUATE",
                    )
                  }
                  className="w-full px-4 py-2 border-2 border-border rounded-lg"
                >
                  <option value="STUDENT">Student</option>
                  <option value="GRADUATE">Graduate</option>
                </select>
              </div>
            )}

            {/* Event Linking */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">
                Link to Event (Optional)
              </label>
              <input
                type="text"
                value={linkedEventId}
                onChange={(e) => setLinkedEventId(e.target.value)}
                placeholder="Event ID (optional)"
                className="w-full px-4 py-2 border-2 border-border rounded-lg"
              />
            </div>

            {/* Preview & Actions */}
            <div className="flex gap-4 justify-between">
              <button
                onClick={handlePreview}
                disabled={loadingPreview}
                className={cn(
                  "flex items-center gap-2 px-4 py-2",
                  "border-2 border-border rounded-lg hover:bg-muted transition disabled:opacity-50",
                )}
              >
                {loadingPreview ? (
                  <LuLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <LuEye className="w-4 h-4" />
                )}
                Preview Recipients
              </button>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border-2 border-border rounded-lg hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || recipientCount === 0}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2",
                    "bg-primary text-background rounded-lg font-bold",
                    "hover:opacity-90 transition disabled:opacity-50",
                  )}
                >
                  {loading ? (
                    <LuLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <LuSend className="w-4 h-4" />
                  )}
                  Send to {recipientCount} Users
                </button>
              </div>
            </div>

            {/* Preview Popover */}
            {previewOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-muted rounded-lg border-2 border-border"
              >
                <h3 className="font-bold mb-3">
                  Preview Recipients (First 10)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {previewRecipients.map((r, i) => (
                    <div key={i} className="text-sm p-2 bg-background rounded">
                      <strong>{r.fullName}</strong>
                      <br />
                      <span className="text-muted-foreground">{r.email}</span>
                    </div>
                  ))}
                </div>
                {recipientCount > 10 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    ... and {recipientCount - 10} more
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
