"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuSend,
  LuEye,
  LuLoader,
  LuUser,
  LuUsers,
  LuUsersRound,
  LuCalendar,
  LuPlus,
  LuTrash2,
} from "react-icons/lu";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { AudienceType, BroadcastFilter, BroadcastTemplateId } from "@/types/broadcast";
import {
  BROADCAST_TEMPLATES,
  renderTemplateFromFields,
} from "@/lib/broadcast/templates";

// ── Local types ───────────────────────────────────────────────────────────────

interface BroadcastModalProps {
  open:       boolean;
  onClose:    () => void;
  onSuccess?: () => void;
  token?:     string;
}

interface PreviewRecipient {
  email:    string;
  fullName: string;
  type:     "account" | "guest";
  userId:   string | null;
}

interface BroadcastEvent {
  id:                 string;
  title:              string;
  slug:               string;
  status:             string;
  eventDate:          string | null;
  capacity:           number;
  accountRegistered:  number;
  guestRegistered:    number;
}

interface AudienceOption {
  id:          AudienceType;
  label:       string;
  description: string;
  group:       "accounts" | "guests" | "mixed";
}

// ── Audience options ──────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS: AudienceOption[] = [
  { id: "all_accounts",        label: "All Accounts",          description: "Every registered account on the platform",             group: "accounts" },
  { id: "verified_members",    label: "Verified Members",      description: "Accounts with approved membership status",             group: "accounts" },
  { id: "pending_members",     label: "Pending Members",       description: "Accounts awaiting membership approval",                group: "accounts" },
  { id: "unverified_accounts", label: "Unverified Accounts",   description: "Accounts without approved or pending membership",      group: "accounts" },
  { id: "active_accounts_only",label: "Active Accounts",       description: "Accounts currently marked active",                     group: "accounts" },
  { id: "global_announcement", label: "Global Announcement",   description: "All accounts — for platform-wide notices",             group: "accounts" },
  { id: "by_role",             label: "By Platform Role",      description: "Filter by admin, moderator, or participant",           group: "accounts" },
  { id: "by_committee",        label: "By Committee",          description: "Members of a specific committee",                      group: "accounts" },
  { id: "by_committee_role",   label: "By Committee Role",     description: "Members holding a specific committee-level role",      group: "accounts" },
  { id: "by_edu_status",       label: "By Education Status",   description: "Filter by student or graduate status",                 group: "accounts" },
  { id: "all_guests",          label: "All Guests",            description: "All verified guest registrations across all events",   group: "guests"   },
  { id: "verified_guests_only",label: "Verified Guests",       description: "Guests who completed email OTP verification",          group: "guests"   },
  { id: "guests_by_event",     label: "Guests by Event",       description: "All verified guests registered for one event",         group: "guests"   },
  { id: "guests_by_status",    label: "Guests by Status",      description: "Filter guests by their registration status",           group: "guests"   },
  { id: "all_users",           label: "All Users",             description: "All accounts + all verified guests combined",          group: "mixed"    },
  { id: "event_registrants",   label: "Event Registrants",     description: "Accounts + guests registered for a specific event",    group: "mixed"    },
];

const GROUP_META: Record<"accounts" | "guests" | "mixed", { label: string; icon: React.ReactNode }> = {
  accounts: { label: "Account Users",                icon: <LuUser      className="w-3 h-3" /> },
  guests:   { label: "Guest Users",                  icon: <LuUsers     className="w-3 h-3" /> },
  mixed:    { label: "Combined (Accounts + Guests)", icon: <LuUsersRound className="w-3 h-3" /> },
};

// ── Shared field input styles ─────────────────────────────────────────────────

const inputCls = cn(
  "w-full px-4 py-2.5 border-2 border-border rounded-lg",
  "focus:outline-none focus:border-primary bg-background text-sm",
);
const labelCls = "block text-xs font-black text-muted-foreground uppercase tracking-widest mb-1.5";

// ── Component ──────────────────────────────────────────────────────────────────

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  open,
  onClose,
  onSuccess,
  token,
}) => {
  // ── Core form ──────────────────────────────────────────────────────────────
  const [subject,     setSubject]     = useState("");
  const [htmlContent, setHtmlContent] = useState(""); // only used in raw_html mode

  // ── Template ───────────────────────────────────────────────────────────────
  const [templateId, setTemplateId] = useState<BroadcastTemplateId>("raw_html");
  const [tf, setTf] = useState<Record<string, string>>({
    urgencyLevel:  "high",
    updateType:    "announcement",
    isFree:        "true",
    actionRequired:"false",
  });
  const [communityUpdateSections, setCommunityUpdateSections] = useState<
    { heading: string; body: string }[]
  >([{ heading: "", body: "" }]);

  const setField = (k: string, v: string) =>
    setTf((prev) => ({ ...prev, [k]: v }));

  // Auto-suggest subject when template type changes and subject is empty
  useEffect(() => {
    if (templateId === "raw_html") return;
    const { subject: suggested } = renderTemplateFromFields(
      templateId,
      tf,
      communityUpdateSections,
    );
    if (suggested && !subject.trim()) setSubject(suggested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  // ── Audience filter ────────────────────────────────────────────────────────
  const [selectedAudience,       setSelectedAudience]       = useState<AudienceType>("all_accounts");
  const [selectedRole,           setSelectedRole]           = useState("participant");
  const [selectedCommittee,      setSelectedCommittee]      = useState("");
  const [selectedCommitteeRole,  setSelectedCommitteeRole]  = useState("MEMBER");
  const [selectedEduStatus,      setSelectedEduStatus]      = useState<"STUDENT" | "GRADUATE">("STUDENT");
  const [selectedEventId,        setSelectedEventId]        = useState("");
  const [selectedGuestStatus,    setSelectedGuestStatus]    = useState<"registered" | "checked-in" | "cancelled">("registered");

  // ── Events data ────────────────────────────────────────────────────────────
  const [events,        setEvents]        = useState<BroadcastEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // ── Preview ────────────────────────────────────────────────────────────────
  const [previewOpen,       setPreviewOpen]       = useState(false);
  const [previewRecipients, setPreviewRecipients] = useState<PreviewRecipient[]>([]);
  const [recipientCount,    setRecipientCount]    = useState(0);
  const [accountCount,      setAccountCount]      = useState(0);
  const [guestCount,        setGuestCount]        = useState(0);
  const [loadingPreview,    setLoadingPreview]    = useState(false);

  // ── Send ───────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  // ── Load events on open ────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    if (!token) return;
    setLoadingEvents(true);
    try {
      const res = await fetch("/api/admin/broadcast/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load events");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      toast.error("Could not load event list");
    } finally {
      setLoadingEvents(false);
    }
  }, [token]);

  useEffect(() => {
    if (open && token) loadEvents();
  }, [open, token, loadEvents]);

  // Reset preview when filter changes
  useEffect(() => {
    setPreviewOpen(false);
    setPreviewRecipients([]);
    setRecipientCount(0);
    setAccountCount(0);
    setGuestCount(0);
  }, [
    selectedAudience, selectedRole, selectedCommittee,
    selectedCommitteeRole, selectedEduStatus,
    selectedEventId, selectedGuestStatus,
  ]);

  // ── Build audience filter ──────────────────────────────────────────────────
  const getFilter = (): BroadcastFilter => {
    const f: BroadcastFilter = { audience: selectedAudience };
    if (selectedAudience === "by_role")              f.role           = selectedRole;
    else if (selectedAudience === "by_committee")    f.committee      = selectedCommittee;
    else if (selectedAudience === "by_committee_role") {
      f.committee    = selectedCommittee;
      f.committeeRole = selectedCommitteeRole;
    } else if (selectedAudience === "by_edu_status") f.eduStatus      = selectedEduStatus;
    else if (
      selectedAudience === "guests_by_event" ||
      selectedAudience === "event_registrants"
    )                                                f.eventId        = selectedEventId;
    else if (selectedAudience === "guests_by_status") f.guestStatus   = selectedGuestStatus;
    return f;
  };

  // ── Generate final html + subject from template ────────────────────────────
  const getFinalContent = (): { finalHtml: string; finalSubject: string } => {
    if (templateId === "raw_html") {
      return { finalHtml: htmlContent, finalSubject: subject };
    }
    const { htmlContent: rendered, subject: suggested } = renderTemplateFromFields(
      templateId,
      tf,
      communityUpdateSections,
    );
    return {
      finalHtml:    rendered,
      finalSubject: subject.trim() || suggested,
    };
  };

  // ── Validate template fields before send ───────────────────────────────────
  const validateContent = (): string | null => {
    if (templateId === "raw_html")
      return htmlContent.trim() ? null : "Message content is required";
    switch (templateId) {
      case "urgent_notice":
        if (!tf.headline?.trim()) return "Headline is required";
        if (!tf.bodyText?.trim()) return "Message body is required";
        break;
      case "general_announcement":
        if (!tf.headline?.trim()) return "Headline is required";
        if (!tf.bodyText?.trim()) return "Message body is required";
        break;
      case "event_promotion":
        if (!tf.eventTitle?.trim())       return "Event title is required";
        if (!tf.eventDate?.trim())        return "Event date is required";
        if (!tf.eventLocation?.trim())    return "Event location is required";
        if (!tf.eventDescription?.trim()) return "Event description is required";
        if (!tf.eventUrl?.trim())         return "Event URL is required";
        break;
      case "community_update":
        if (!tf.headline?.trim()) return "Headline is required";
        if (!tf.intro?.trim())    return "Intro text is required";
        break;
      case "platform_update":
        if (!tf.title?.trim())       return "Title is required";
        if (!tf.description?.trim()) return "Description is required";
        break;
    }
    return null;
  };

  // ── Preview ────────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/admin/broadcast/preview", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ filter: getFilter() }),
      });
      if (!res.ok) throw new Error("Preview failed");
      const data = await res.json();
      setPreviewRecipients(data.preview ?? []);
      setRecipientCount(data.totalCount ?? 0);
      setAccountCount(data.accountCount ?? 0);
      setGuestCount(data.guestCount ?? 0);
      setPreviewOpen(true);
    } catch {
      toast.error("Failed to load recipient preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const contentError = validateContent();
    if (contentError) { toast.error(contentError); return; }

    const { finalHtml, finalSubject } = getFinalContent();
    if (!finalSubject.trim()) { toast.error("Subject is required"); return; }
    if (!finalHtml.trim())    { toast.error("Message content is required"); return; }
    if (!previewOpen)         { toast.error("Preview recipients before sending"); return; }
    if (recipientCount === 0) { toast.error("No recipients match the selected criteria"); return; }

    if (recipientCount > 1000) {
      const ok = window.confirm(
        `Send to ${recipientCount} recipients?\n` +
        `(${accountCount} accounts + ${guestCount} guests)\n\nThis cannot be undone.`,
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      // Step 1 — create broadcast record
      const createRes = await fetch("/api/admin/broadcast", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          subject:       finalSubject,
          htmlContent:   finalHtml,
          filter:        getFilter(),
          sendImmediately: true,
          templateId:    templateId !== "raw_html" ? templateId : undefined,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create broadcast");
      const { id: broadcastId } = await createRes.json();

      // Step 2 — trigger send
      const sendRes = await fetch("/api/admin/broadcast/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ broadcastId }),
      });
      if (!sendRes.ok) throw new Error("Failed to queue broadcast");

      toast.success(
        `Broadcast queued — ${recipientCount} recipients ` +
        `(${accountCount} accounts · ${guestCount} guests)`,
      );
      onSuccess?.();
      handleClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset + close ──────────────────────────────────────────────────────────
  const handleClose = () => {
    setSubject("");
    setHtmlContent("");
    setSelectedAudience("all_accounts");
    setSelectedEventId("");
    setPreviewOpen(false);
    setPreviewRecipients([]);
    setRecipientCount(0);
    setAccountCount(0);
    setGuestCount(0);
    setTemplateId("raw_html");
    setTf({ urgencyLevel: "high", updateType: "announcement", isFree: "true", actionRequired: "false" });
    setCommunityUpdateSections([{ heading: "", body: "" }]);
    onClose();
  };

  // ── Derived flags ──────────────────────────────────────────────────────────
  const needsEvent       = selectedAudience === "guests_by_event" || selectedAudience === "event_registrants";
  const needsRole        = selectedAudience === "by_role";
  const needsCommittee   = selectedAudience === "by_committee" || selectedAudience === "by_committee_role";
  const needsEdu         = selectedAudience === "by_edu_status";
  const needsGuestStatus = selectedAudience === "guests_by_status";
  const selectedEvent    = events.find((e) => e.id === selectedEventId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22 }}
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[92vw] max-w-4xl max-h-[90vh] overflow-y-auto",
              "bg-background border-2 border-border rounded-2xl p-8 shadow-2xl z-50",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">📢 Send Broadcast</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            {/* ── Template selector ──────────────────────────────────────────── */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3">
                Template
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {BROADCAST_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setTemplateId(tpl.id)}
                    className={cn(
                      "p-3 text-left border-2 rounded-xl transition",
                      templateId === tpl.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="text-base mb-1">{tpl.emoji}</div>
                    <div className="text-sm font-bold">{tpl.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {tpl.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Subject ────────────────────────────────────────────────────── */}
            <div className="mb-5">
              <label className="block text-sm font-bold mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Upcoming Workshop — Don't Miss Out"
                className={inputCls}
              />
            </div>

            {/* ── Content — raw HTML mode ───────────────────────────────────── */}
            {templateId === "raw_html" && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">
                  Message{" "}
                  <span className="font-normal text-muted-foreground">
                    (HTML supported)
                  </span>
                </label>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<p>Hello everyone,</p>"
                  rows={7}
                  className={cn(inputCls, "font-mono")}
                />
              </div>
            )}

            {/* ── Content — template fields ─────────────────────────────────── */}
            {templateId !== "raw_html" && (
              <div className="mb-6 p-5 bg-muted/40 border-2 border-border rounded-xl space-y-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Message Details
                </p>

                {/* ── Urgent Notice ─────────────────────────────────────────── */}
                {templateId === "urgent_notice" && (
                  <>
                    <div>
                      <label className={labelCls}>Urgency Level</label>
                      <select
                        value={tf.urgencyLevel ?? "high"}
                        onChange={(e) => setField("urgencyLevel", e.target.value)}
                        className={inputCls}
                      >
                        <option value="critical">🚨 Critical — immediate action required</option>
                        <option value="high">⚠️ High — important update</option>
                        <option value="medium">ℹ️ Medium — informational notice</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Headline</label>
                      <input
                        type="text"
                        value={tf.headline ?? ""}
                        onChange={(e) => setField("headline", e.target.value)}
                        placeholder="e.g., Platform Maintenance Tonight at 11 PM"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Message Body</label>
                      <textarea
                        value={tf.bodyText ?? ""}
                        onChange={(e) => setField("bodyText", e.target.value)}
                        rows={5}
                        placeholder={"Use double line breaks for new paragraphs.\n\nLike this."}
                        className={inputCls}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>
                          CTA Button Label{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.ctaLabel ?? ""}
                          onChange={(e) => setField("ctaLabel", e.target.value)}
                          placeholder="e.g., Learn More"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          CTA URL{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.ctaUrl ?? ""}
                          onChange={(e) => setField("ctaUrl", e.target.value)}
                          placeholder="https://..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── General Announcement ──────────────────────────────────── */}
                {templateId === "general_announcement" && (
                  <>
                    <div>
                      <label className={labelCls}>Headline</label>
                      <input
                        type="text"
                        value={tf.headline ?? ""}
                        onChange={(e) => setField("headline", e.target.value)}
                        placeholder="e.g., LASCADSS 8.0 Applications Are Now Open"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Message Body</label>
                      <textarea
                        value={tf.bodyText ?? ""}
                        onChange={(e) => setField("bodyText", e.target.value)}
                        rows={5}
                        placeholder="Double line break = new paragraph."
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>
                        Bullet Points{" "}
                        <span className="normal-case font-normal">(optional — one per line)</span>
                      </label>
                      <textarea
                        value={tf.bulletPointsRaw ?? ""}
                        onChange={(e) => setField("bulletPointsRaw", e.target.value)}
                        rows={3}
                        placeholder={"Free to attend\nLimited spots\nCertificate of participation"}
                        className={cn(inputCls, "font-mono text-xs")}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>
                          CTA Button Label{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.ctaLabel ?? ""}
                          onChange={(e) => setField("ctaLabel", e.target.value)}
                          placeholder="e.g., Apply Now"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          CTA URL{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.ctaUrl ?? ""}
                          onChange={(e) => setField("ctaUrl", e.target.value)}
                          placeholder="https://..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Event Promotion ───────────────────────────────────────── */}
                {templateId === "event_promotion" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Event Title</label>
                        <input
                          type="text"
                          value={tf.eventTitle ?? ""}
                          onChange={(e) => setField("eventTitle", e.target.value)}
                          placeholder="e.g., LASCADSS Annual Summit 2025"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Date & Time</label>
                        <input
                          type="text"
                          value={tf.eventDate ?? ""}
                          onChange={(e) => setField("eventDate", e.target.value)}
                          placeholder="e.g., Saturday, Aug 9 · 10:00 AM WAT"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Location</label>
                      <input
                        type="text"
                        value={tf.eventLocation ?? ""}
                        onChange={(e) => setField("eventLocation", e.target.value)}
                        placeholder="e.g., Main Auditorium, ABSU  or  Virtual / Online"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Event Description</label>
                      <textarea
                        value={tf.eventDescription ?? ""}
                        onChange={(e) => setField("eventDescription", e.target.value)}
                        rows={3}
                        placeholder="Short promotional blurb about the event..."
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Event Page URL</label>
                      <input
                        type="text"
                        value={tf.eventUrl ?? ""}
                        onChange={(e) => setField("eventUrl", e.target.value)}
                        placeholder="https://diuscadi.org.ng/events/..."
                        className={inputCls}
                      />
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isFree"
                          value="true"
                          checked={tf.isFree === "true"}
                          onChange={() => setField("isFree", "true")}
                        />
                        <span className="text-sm font-semibold">Free</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isFree"
                          value="false"
                          checked={tf.isFree === "false"}
                          onChange={() => setField("isFree", "false")}
                        />
                        <span className="text-sm font-semibold">Paid</span>
                      </label>
                    </div>
                    {tf.isFree === "false" && (
                      <div>
                        <label className={labelCls}>Ticket Price</label>
                        <input
                          type="text"
                          value={tf.ticketPrice ?? ""}
                          onChange={(e) => setField("ticketPrice", e.target.value)}
                          placeholder="e.g., ₦2,500"
                          className={inputCls}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>
                          Registration Deadline{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.registrationDeadline ?? ""}
                          onChange={(e) => setField("registrationDeadline", e.target.value)}
                          placeholder="e.g., Friday, August 1"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          CTA Label{" "}
                          <span className="normal-case font-normal">(default: Register Now)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.ctaLabel ?? ""}
                          onChange={(e) => setField("ctaLabel", e.target.value)}
                          placeholder="Register Now"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Community Update ──────────────────────────────────────── */}
                {templateId === "community_update" && (
                  <>
                    <div>
                      <label className={labelCls}>Headline</label>
                      <input
                        type="text"
                        value={tf.headline ?? ""}
                        onChange={(e) => setField("headline", e.target.value)}
                        placeholder="e.g., Community Roundup — June 2025"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Opening Paragraph</label>
                      <textarea
                        value={tf.intro ?? ""}
                        onChange={(e) => setField("intro", e.target.value)}
                        rows={3}
                        placeholder="Here's what's been happening across the DIUSCADI community..."
                        className={inputCls}
                      />
                    </div>

                    {/* Dynamic sections */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={cn(labelCls, "mb-0")}>
                          Sections{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <button
                          onClick={() =>
                            setCommunityUpdateSections((prev) => [
                              ...prev,
                              { heading: "", body: "" },
                            ])
                          }
                          className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80"
                        >
                          <LuPlus className="w-3.5 h-3.5" /> Add Section
                        </button>
                      </div>
                      <div className="space-y-3">
                        {communityUpdateSections.map((sec, i) => (
                          <div
                            key={i}
                            className="flex gap-2 items-start p-3 bg-background border border-border rounded-lg"
                          >
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={sec.heading}
                                onChange={(e) =>
                                  setCommunityUpdateSections((prev) =>
                                    prev.map((s, j) =>
                                      j === i ? { ...s, heading: e.target.value } : s,
                                    ),
                                  )
                                }
                                placeholder="Section heading"
                                className={cn(inputCls, "py-1.5 text-xs")}
                              />
                              <textarea
                                value={sec.body}
                                onChange={(e) =>
                                  setCommunityUpdateSections((prev) =>
                                    prev.map((s, j) =>
                                      j === i ? { ...s, body: e.target.value } : s,
                                    ),
                                  )
                                }
                                rows={2}
                                placeholder="Section body text..."
                                className={cn(inputCls, "py-1.5 text-xs")}
                              />
                            </div>
                            {communityUpdateSections.length > 1 && (
                              <button
                                onClick={() =>
                                  setCommunityUpdateSections((prev) =>
                                    prev.filter((_, j) => j !== i),
                                  )
                                }
                                className="p-1.5 text-muted-foreground hover:text-destructive mt-1"
                              >
                                <LuTrash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>
                          CTA Label{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.ctaLabel ?? ""}
                          onChange={(e) => setField("ctaLabel", e.target.value)}
                          placeholder="e.g., Read More"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          CTA URL{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.ctaUrl ?? ""}
                          onChange={(e) => setField("ctaUrl", e.target.value)}
                          placeholder="https://..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Platform Update ───────────────────────────────────────── */}
                {templateId === "platform_update" && (
                  <>
                    <div>
                      <label className={labelCls}>Update Type</label>
                      <select
                        value={tf.updateType ?? "announcement"}
                        onChange={(e) => setField("updateType", e.target.value)}
                        className={inputCls}
                      >
                        <option value="announcement">📣 Platform Announcement</option>
                        <option value="feature">✨ New Feature</option>
                        <option value="maintenance">🔧 Scheduled Maintenance</option>
                        <option value="critical">🚨 Critical Notice</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Title</label>
                      <input
                        type="text"
                        value={tf.title ?? ""}
                        onChange={(e) => setField("title", e.target.value)}
                        placeholder="e.g., Scheduled Maintenance — Sunday 3 AM WAT"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Description</label>
                      <textarea
                        value={tf.description ?? ""}
                        onChange={(e) => setField("description", e.target.value)}
                        rows={4}
                        placeholder="We will be performing database upgrades to improve platform performance..."
                        className={inputCls}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>
                          Start Time{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.startTime ?? ""}
                          onChange={(e) => setField("startTime", e.target.value)}
                          placeholder="e.g., Sunday 20 Jul · 3:00 AM WAT"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          End Time{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.endTime ?? ""}
                          onChange={(e) => setField("endTime", e.target.value)}
                          placeholder="e.g., Sunday 20 Jul · 6:00 AM WAT"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>
                        Affected Features{" "}
                        <span className="normal-case font-normal">(optional — one per line)</span>
                      </label>
                      <textarea
                        value={tf.affectedFeaturesRaw ?? ""}
                        onChange={(e) => setField("affectedFeaturesRaw", e.target.value)}
                        rows={3}
                        placeholder={"Event registration\nProfile uploads\nTicket downloads"}
                        className={cn(inputCls, "font-mono text-xs")}
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tf.actionRequired === "true"}
                        onChange={(e) =>
                          setField("actionRequired", e.target.checked ? "true" : "false")
                        }
                        className="w-4 h-4 accent-primary"
                      />
                      <div>
                        <span className="text-sm font-bold">Action Required</span>
                        <p className="text-xs text-muted-foreground">
                          Shows a red warning banner in the email
                        </p>
                      </div>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>
                          CTA Label{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.ctaLabel ?? ""}
                          onChange={(e) => setField("ctaLabel", e.target.value)}
                          placeholder="e.g., View Status Page"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          CTA URL{" "}
                          <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={tf.ctaUrl ?? ""}
                          onChange={(e) => setField("ctaUrl", e.target.value)}
                          placeholder="https://..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Audience selector ─────────────────────────────────────────── */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3">Audience</label>
              <div className="space-y-5">
                {(["accounts", "guests", "mixed"] as const).map((group) => (
                  <div key={group}>
                    <p className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                      {GROUP_META[group].icon}
                      {GROUP_META[group].label}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {AUDIENCE_OPTIONS.filter((o) => o.group === group).map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedAudience(opt.id)}
                          className={cn(
                            "p-3 text-left border-2 rounded-lg transition",
                            selectedAudience === opt.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40",
                          )}
                        >
                          <div className="text-sm font-bold">{opt.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {opt.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Conditional filter fields ──────────────────────────────────── */}

            {/* Event picker */}
            {needsEvent && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Select Event</label>
                {loadingEvents ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <LuLoader className="w-4 h-4 animate-spin" />
                    Loading events...
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className={cn(inputCls, !selectedEventId && "text-muted-foreground")}
                    >
                      <option value="">— Choose an event —</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                          {ev.eventDate
                            ? ` · ${new Date(ev.eventDate).toLocaleDateString("en-NG", {
                                day: "numeric", month: "short", year: "numeric",
                              })}`
                            : ""}
                          {` · ${ev.accountRegistered + ev.guestRegistered} registered`}
                        </option>
                      ))}
                    </select>
                    {selectedEvent && (
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <LuCalendar className="w-3 h-3" />
                          {selectedEvent.status}
                        </span>
                        <span className="flex items-center gap-1">
                          <LuUser className="w-3 h-3" />
                          {selectedEvent.accountRegistered} accounts
                        </span>
                        <span className="flex items-center gap-1">
                          <LuUsers className="w-3 h-3" />
                          {selectedEvent.guestRegistered} guests
                        </span>
                        <span>
                          {selectedEvent.accountRegistered + selectedEvent.guestRegistered}
                          {" "}/ {selectedEvent.capacity} capacity
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Role picker */}
            {needsRole && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Platform Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className={inputCls}
                >
                  <option value="participant">Participant</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="webmaster">Webmaster</option>
                </select>
              </div>
            )}

            {/* Committee picker */}
            {needsCommittee && (
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Committee</label>
                  <input
                    type="text"
                    value={selectedCommittee}
                    onChange={(e) => setSelectedCommittee(e.target.value)}
                    placeholder="e.g., media, sports, welfare"
                    className={inputCls}
                  />
                </div>
                {selectedAudience === "by_committee_role" && (
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Role within Committee
                    </label>
                    <select
                      value={selectedCommitteeRole}
                      onChange={(e) => setSelectedCommitteeRole(e.target.value)}
                      className={inputCls}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="COORDINATOR">Coordinator</option>
                      <option value="HEAD">Head</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Edu status picker */}
            {needsEdu && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">
                  Education Status
                </label>
                <select
                  value={selectedEduStatus}
                  onChange={(e) =>
                    setSelectedEduStatus(e.target.value as "STUDENT" | "GRADUATE")
                  }
                  className={inputCls}
                >
                  <option value="STUDENT">Student</option>
                  <option value="GRADUATE">Graduate</option>
                </select>
              </div>
            )}

            {/* Guest status picker */}
            {needsGuestStatus && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">
                  Guest Registration Status
                </label>
                <select
                  value={selectedGuestStatus}
                  onChange={(e) =>
                    setSelectedGuestStatus(
                      e.target.value as "registered" | "checked-in" | "cancelled",
                    )
                  }
                  className={inputCls}
                >
                  <option value="registered">Registered</option>
                  <option value="checked-in">Checked In</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {/* ── Preview panel ──────────────────────────────────────────────── */}
            {previewOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-muted rounded-xl border-2 border-border"
              >
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <LuUsersRound className="w-4 h-4 text-primary" />
                    <span className="font-black text-sm">{recipientCount} total</span>
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <LuUser className="w-3.5 h-3.5" />
                    {accountCount} accounts
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <LuUsers className="w-3.5 h-3.5" />
                    {guestCount} guests
                  </span>
                </div>

                {recipientCount === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recipients match this filter.
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      First 10 Recipients
                    </p>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {previewRecipients.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm p-2 bg-background rounded-lg"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold truncate">{r.fullName}</span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              {r.email}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "ml-3 shrink-0 text-[10px] font-bold uppercase tracking-wider",
                              "px-2 py-0.5 rounded-full",
                              r.type === "account"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted-foreground/15 text-muted-foreground",
                            )}
                          >
                            {r.type}
                          </span>
                        </div>
                      ))}
                    </div>
                    {recipientCount > 10 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        + {recipientCount - 10} more recipients
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ── Actions ────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handlePreview}
                disabled={loadingPreview}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm",
                  "border-2 border-border rounded-lg hover:bg-muted",
                  "transition disabled:opacity-50",
                )}
              >
                {loadingPreview ? (
                  <LuLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <LuEye className="w-4 h-4" />
                )}
                Preview Recipients
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 border-2 border-border rounded-lg hover:bg-muted transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || !previewOpen || recipientCount === 0}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 text-sm",
                    "bg-primary text-background rounded-lg font-bold",
                    "hover:opacity-90 transition disabled:opacity-50",
                  )}
                >
                  {loading ? (
                    <LuLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <LuSend className="w-4 h-4" />
                  )}
                  {previewOpen && recipientCount > 0
                    ? `Send to ${recipientCount}`
                    : "Send Broadcast"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};