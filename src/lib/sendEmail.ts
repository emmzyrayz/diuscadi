// lib/sendEmail.ts
//
// Dev:  logs to console only — no SMTP env vars required.
// Prod: sends real emails via Brevo SMTP relay (transactional)
//       or Brevo Campaigns API (bulk/broadcast).
//
// API routes import ONLY from here — never from MailTemplate.ts or mailer.ts directly.

import {
  verificationEmail,
  resetPasswordEmail,
  welcomeEmail,
  schoolVerificationEmail,
  eventRegistrationEmail,
  eventReminderEmail,
  applicationStatusEmail,
  membershipWelcomeEmail,
  guestVerificationEmail,
  guestConfirmationEmail,
  migrationWelcomeEmail,
  broadcastEmail,
  eventAnnouncementEmail,
  platformUpdateEmail,
  type EventRegistrationEmailOptions,
  type EventReminderEmailOptions,
  type ApplicationStatusEmailOptions,
  type MembershipWelcomeEmailOptions,
  type GuestVerificationEmailOptions,
  type GuestConfirmationEmailOptions,
  type BroadcastEmailOptions,
  type EventAnnouncementEmailOptions,
  type PlatformUpdateEmailOptions,
} from "@/lib/MailTemplate";

const IS_DEV =
  process.env.NODE_ENV === "development" &&
  process.env.SEND_REAL_EMAILS !== "true";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Lazy-load mailer in production only.
// mailer.ts throws at module load if Brevo env vars are missing —
// dynamic import keeps dev completely isolated from it.
async function prodSend(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const { sendMail } = await import("@/utils/mailer");
  await sendMail(options);
}

// ─── 1. Verification email ────────────────────────────────────────────────────

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  code: string;
  token: string;
}): Promise<void> {
  const verifyUrl = `${APP_URL}/auth/verify?token=${opts.token}&email=${encodeURIComponent(opts.to)}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Verification → ${opts.to}`);
    console.log(`  Name:       ${opts.name}`);
    console.log(`  OTP:        ${opts.code}`);
    console.log(`  Magic link: ${verifyUrl}`);
    return;
  }

  const { subject, html, text } = verificationEmail({
    name: opts.name,
    code: opts.code,
    verifyUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 2. Password reset email ──────────────────────────────────────────────────

export async function sendResetPasswordEmail(opts: {
  to: string;
  name: string;
  code: string;
  token: string;
}): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${opts.token}&email=${encodeURIComponent(opts.to)}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Password reset → ${opts.to}`);
    console.log(`  Name:      ${opts.name}`);
    console.log(`  OTP:       ${opts.code}`);
    console.log(`  Reset URL: ${resetUrl}`);
    return;
  }

  const { subject, html, text } = resetPasswordEmail({
    name: opts.name,
    code: opts.code,
    resetUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 3. Welcome email (sent after successful verification) ────────────────────

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  role: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Welcome → ${opts.to}`);
    console.log(`  Name: ${opts.name}`);
    console.log(`  Role: ${opts.role}`);
    return;
  }

  const { subject, html, text } = welcomeEmail({
    name: opts.name,
    role: opts.role,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 4. School email verification ────────────────────────────────────────────

export async function sendSchoolVerificationEmail(opts: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] School email verification → ${opts.to}`);
    console.log(`  Name:  ${opts.name}`);
    console.log(`  OTP:   ${opts.code}`);
    return;
  }

  const { subject, html, text } = schoolVerificationEmail({
    name: opts.name,
    code: opts.code,
    schoolEmail: opts.to,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 5. Event registration confirmation ──────────────────────────────────────

export async function sendEventRegistrationEmail(
  opts: {
    to: string;
    ticketId: string;
    whatsappGroupLink?: string;
  } & Omit<EventRegistrationEmailOptions, "ticketUrl">,
): Promise<void> {
  const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Event registration confirmation → ${opts.to}`);
    console.log(`  Event:       ${opts.eventTitle}`);
    console.log(`  Date:        ${opts.eventDate}`);
    console.log(`  Location:    ${opts.eventLocation}`);
    console.log(`  Ticket code: ${opts.ticketCode}`);
    console.log(`  Ticket URL:  ${ticketUrl}`);
    if (opts.whatsappGroupLink) {
      console.log(`  WhatsApp:    ${opts.whatsappGroupLink}`);
    }
    return;
  }

  const { subject, html, text } = eventRegistrationEmail({
    name: opts.name,
    eventTitle: opts.eventTitle,
    eventDate: opts.eventDate,
    eventLocation: opts.eventLocation,
    ticketCode: opts.ticketCode,
    ticketUrl,
    isFree: opts.isFree,
    ticketPrice: opts.ticketPrice,
    whatsappGroupLink: opts.whatsappGroupLink,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 6. Event reminder ────────────────────────────────────────────────────────

export async function sendEventReminderEmail(
  opts: {
    to: string;
    ticketId: string;
  } & Omit<EventReminderEmailOptions, "ticketUrl">,
): Promise<void> {
  const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Event reminder → ${opts.to}`);
    console.log(`  Event:       ${opts.eventTitle}`);
    console.log(`  Hours until: ${opts.hoursUntil}`);
    console.log(`  Ticket code: ${opts.ticketCode}`);
    return;
  }

  const { subject, html, text } = eventReminderEmail({
    name: opts.name,
    eventTitle: opts.eventTitle,
    eventDate: opts.eventDate,
    eventLocation: opts.eventLocation,
    ticketCode: opts.ticketCode,
    ticketUrl,
    hoursUntil: opts.hoursUntil,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 7. Application status (approved or rejected) ────────────────────────────

export async function sendApplicationStatusEmail(
  opts: {
    to: string;
  } & ApplicationStatusEmailOptions,
): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Application ${opts.status} → ${opts.to}`);
    console.log(`  Type:   ${opts.applicationType}`);
    console.log(`  Status: ${opts.status}`);
    if (opts.reviewNote) console.log(`  Note:   ${opts.reviewNote}`);
    return;
  }

  const { subject, html, text } = applicationStatusEmail({
    name: opts.name,
    applicationType: opts.applicationType,
    status: opts.status,
    reviewNote: opts.reviewNote,
    ctaLabel: opts.ctaLabel,
    ctaUrl: opts.ctaUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 8. Membership approved welcome ──────────────────────────────────────────

export async function sendMembershipWelcomeEmail(
  opts: {
    to: string;
  } & MembershipWelcomeEmailOptions,
): Promise<void> {
  const profileUrl = opts.profileUrl ?? `${APP_URL}/profile`;
  const eventsUrl = opts.eventsUrl ?? `${APP_URL}/events`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Membership welcome → ${opts.to}`);
    console.log(`  Name:        ${opts.name}`);
    console.log(`  Profile URL: ${profileUrl}`);
    console.log(`  Events URL:  ${eventsUrl}`);
    return;
  }

  const { subject, html, text } = membershipWelcomeEmail({
    name: opts.name,
    profileUrl,
    eventsUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 9. Contact form — internal notification ──────────────────────────────────

export async function sendContactEnquiryEmail(opts: {
  senderName: string;
  senderEmail: string;
  organisation?: string;
  enquiryType: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Contact enquiry → DIUSCADI inbox`);
    console.log(`  From:    ${opts.senderName} <${opts.senderEmail}>`);
    console.log(`  Type:    ${opts.enquiryType}`);
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  Message: ${opts.message.slice(0, 80)}...`);
    return;
  }

  const { contactEnquiryEmail } = await import("@/lib/MailTemplate");
  const { subject, html, text } = contactEnquiryEmail(opts);
  await prodSend({
    to: process.env.CONTACT_INBOX_EMAIL ?? "info@diuscadi.org.ng",
    subject,
    html,
    text,
  });
}

// ─── 10. Contact form — auto-reply to sender ──────────────────────────────────

export async function sendContactAutoReplyEmail(opts: {
  to: string;
  senderName: string;
  enquiryType: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Contact auto-reply → ${opts.to}`);
    console.log(`  Name:    ${opts.senderName}`);
    console.log(`  Subject: ${opts.subject}`);
    return;
  }

  const { contactAutoReplyEmail } = await import("@/lib/MailTemplate");
  const { subject, html, text } = contactAutoReplyEmail({
    senderName: opts.senderName,
    enquiryType: opts.enquiryType,
    subject: opts.subject,
    message: opts.message,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 11. Guest registration — OTP verification email ─────────────────────────

export async function sendGuestVerificationEmail(opts: {
  to: string;
  name: string;
  code: string;
  eventTitle: string;
  verifyUrl: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Guest verification → ${opts.to}`);
    console.log(`  Name:       ${opts.name}`);
    console.log(`  Event:      ${opts.eventTitle}`);
    console.log(`  OTP:        ${opts.code}`);
    console.log(`  Verify URL: ${opts.verifyUrl}`);
    return;
  }

  const { subject, html, text } = guestVerificationEmail({
    name: opts.name,
    code: opts.code,
    eventTitle: opts.eventTitle,
    verifyUrl: opts.verifyUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 12. Guest registration — confirmation email (post-OTP) ──────────────────

export async function sendGuestConfirmationEmail(
  opts: {
    to: string;
    ticketId: string;
    whatsappGroupLink?: string;
  } & Omit<GuestConfirmationEmailOptions, "ticketUrl">,
): Promise<void> {
  const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Guest confirmation → ${opts.to}`);
    console.log(`  Name:            ${opts.name}`);
    console.log(`  Event:           ${opts.eventTitle}`);
    console.log(`  Date:            ${opts.eventDate}`);
    console.log(`  Location:        ${opts.eventLocation}`);
    console.log(`  Ticket code:     ${opts.ticketCode}`);
    console.log(`  Registration:    ${opts.registrationType}`);
    console.log(`  Ticket URL:      ${ticketUrl}`);
    if (opts.whatsappGroupLink) {
      console.log(`  WhatsApp:        ${opts.whatsappGroupLink}`);
    }
    return;
  }

  const { subject, html, text } = guestConfirmationEmail({
    name: opts.name,
    eventTitle: opts.eventTitle,
    eventDate: opts.eventDate,
    eventLocation: opts.eventLocation,
    ticketCode: opts.ticketCode,
    ticketUrl,
    isFree: opts.isFree,
    ticketPrice: opts.ticketPrice,
    whatsappGroupLink: opts.whatsappGroupLink,
    registrationType: opts.registrationType,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 13. Guest → Account migration welcome ───────────────────────────────────

export async function sendMigrationWelcomeEmail(opts: {
  to: string;
  name: string;
  tempPassword: string;
  loginUrl: string;
  resetUrl: string;
  eventsCount: number;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Migration welcome → ${opts.to}`);
    console.log(`  Name:          ${opts.name}`);
    console.log(`  Temp password: ${opts.tempPassword}`);
    console.log(`  Login URL:     ${opts.loginUrl}`);
    console.log(`  Reset URL:     ${opts.resetUrl}`);
    console.log(`  Tickets:       ${opts.eventsCount} migrated`);
    return;
  }

  const { subject, html, text } = migrationWelcomeEmail({
    name: opts.name,
    tempPassword: opts.tempPassword,
    loginUrl: opts.loginUrl,
    resetUrl: opts.resetUrl,
    eventsCount: opts.eventsCount,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 14. Broadcast email (single recipient, transactional) ───────────────────
//
// Wraps admin-authored HTML in the DIUSCADI email shell and sends to one
// recipient. Called in a loop by the broadcast send route (fire-and-forget).
// For large audiences, prefer sendBulkBroadcast() below.

export async function sendBroadcastEmail(
  opts: { to: string } & BroadcastEmailOptions,
): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Broadcast → ${opts.to}`);
    console.log(`  Subject:   ${opts.subject}`);
    if (opts.recipientName) console.log(`  Recipient: ${opts.recipientName}`);
    if (opts.linkedEvent) console.log(`  Event:     ${opts.linkedEvent.title}`);
    return;
  }

  const { subject, html, text } = broadcastEmail({
    subject: opts.subject,
    htmlContent: opts.htmlContent,
    textContent: opts.textContent,
    recipientName: opts.recipientName,
    linkedEvent: opts.linkedEvent,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 15. Event announcement email ─────────────────────────────────────────────

export async function sendEventAnnouncementEmail(
  opts: { to: string } & EventAnnouncementEmailOptions,
): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Event announcement → ${opts.to}`);
    console.log(`  Event:    ${opts.eventTitle}`);
    console.log(`  Date:     ${opts.eventDate}`);
    console.log(`  Location: ${opts.eventLocation}`);
    console.log(`  Free:     ${opts.isFree}`);
    if (opts.registrationDeadline)
      console.log(`  Deadline: ${opts.registrationDeadline}`);
    return;
  }

  const { subject, html, text } = eventAnnouncementEmail({ ...opts });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 16. Platform update / maintenance email ───────────────────────────────────

export async function sendPlatformUpdateEmail(
  opts: { to: string } & PlatformUpdateEmailOptions,
): Promise<void> {
  if (IS_DEV) {
    console.log(
      `[DEV EMAIL] Platform update (${opts.updateType}) → ${opts.to}`,
    );
    console.log(`  Title: ${opts.title}`);
    if (opts.startTime) console.log(`  Start: ${opts.startTime}`);
    if (opts.endTime) console.log(`  End:   ${opts.endTime}`);
    if (opts.affectedFeatures?.length)
      console.log(`  Affects: ${opts.affectedFeatures.join(", ")}`);
    if (opts.actionRequired) console.log(`  ⚠ Action required`);
    return;
  }

  const { subject, html, text } = platformUpdateEmail({ ...opts });
  await prodSend({ to: opts.to, subject, html, text });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BULK / CAMPAIGN SENDS  (Brevo Campaigns API)
// ═══════════════════════════════════════════════════════════════════════════════
//
// These functions use the Brevo Campaigns API instead of SMTP.
// Use them for large audiences (newsletters, event announcements to all members,
// platform-wide maintenance alerts, etc.).
//
// Key differences from the single-send helpers above:
//   • Personalisation  — limited to attributes available in the Brevo template.
//                        For per-recipient ticket codes, use the loop approach
//                        with sendBroadcastEmail() instead.
//   • Scheduling       — pass scheduledAt (ISO-8601) to queue ahead of time.
//   • Tracking         — opens, clicks, and unsubscribes are tracked by Brevo.
//   • Rate limits      — no per-email rate limit; Brevo handles queuing.
//   • Unsubscribes     — Brevo automatically appends a compliant footer with
//                        an unsubscribe link on every campaign email.

import type { BrevoContact } from "@/utils/mailer";

// ─── 17. Bulk broadcast (admin HTML content to a list of recipients) ──────────
//
// The most common bulk helper. Pass the same HTML you'd use in sendBroadcastEmail
// and a list of {email, name} objects. Brevo will queue and dispatch the campaign.
//
// Usage (e.g. from your admin broadcast route):
//
//   await sendBulkBroadcast({
//     campaignName: `Broadcast #${broadcastId}`,
//     subject: "Important update from DIUSCADI",
//     htmlContent: compiledHtml,
//     contacts: members.map(m => ({ email: m.email, name: m.name })),
//   });

export async function sendBulkBroadcast(opts: {
  campaignName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  contacts: BrevoContact[];
  /** ISO-8601 schedule time. Omit to send immediately. */
  scheduledAt?: string;
}): Promise<{ campaignId: number }> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Bulk broadcast campaign`);
    console.log(`  Campaign:   ${opts.campaignName}`);
    console.log(`  Subject:    ${opts.subject}`);
    console.log(`  Recipients: ${opts.contacts.length}`);
    if (opts.scheduledAt) console.log(`  Scheduled:  ${opts.scheduledAt}`);
    return { campaignId: 0 };
  }

  const { sendBulkCampaign } = await import("@/utils/mailer");
  return sendBulkCampaign({
    campaignName: opts.campaignName,
    subject: opts.subject,
    sender: {
      name: "DIUSCADI",
      email: process.env.BREVO_SENDER_EMAIL ?? "info@diuscadi.org.ng",
    },
    htmlContent: opts.htmlContent,
    textContent: opts.textContent,
    contacts: opts.contacts,
    scheduledAt: opts.scheduledAt,
  });
}

// ─── 18. Bulk event announcement ─────────────────────────────────────────────
//
// Send the structured event announcement template to a large audience via
// the Campaigns API. Unlike sendEventAnnouncementEmail() (which loops over
// single SMTP sends), this creates one campaign and Brevo handles delivery.
//
// Usage:
//   await sendBulkEventAnnouncement({
//     eventTitle: "LASCADSS Annual Summit 2025",
//     eventDate: "Saturday, August 9 • 10:00 AM WAT",
//     eventLocation: "Main Auditorium, ABSU",
//     eventDescription: "Join us for the biggest ...",
//     eventUrl: "https://diuscadi.org.ng/events/summit-2025",
//     isFree: false,
//     ticketPrice: "₦2,500",
//     registrationDeadline: "Friday, August 1",
//     contacts: allMembers.map(m => ({ email: m.email, name: m.name })),
//   });

export async function sendBulkEventAnnouncement(
  opts: Omit<EventAnnouncementEmailOptions, "recipientName"> & {
    contacts: BrevoContact[];
    scheduledAt?: string;
  },
): Promise<{ campaignId: number }> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Bulk event announcement`);
    console.log(`  Event:      ${opts.eventTitle}`);
    console.log(`  Recipients: ${opts.contacts.length}`);
    if (opts.scheduledAt) console.log(`  Scheduled:  ${opts.scheduledAt}`);
    return { campaignId: 0 };
  }

  // Build a single generic HTML (no per-recipient personalisation for campaigns)
  const { html, text, subject } = eventAnnouncementEmail({
    ...opts,
    recipientName: "Member", // generic salutation for bulk sends
  });

  const { sendBulkCampaign } = await import("@/utils/mailer");
  return sendBulkCampaign({
    campaignName: `Event: ${opts.eventTitle}`,
    subject,
    sender: {
      name: "DIUSCADI",
      email: process.env.BREVO_SENDER_EMAIL ?? "info@diuscadi.org.ng",
    },
    htmlContent: html,
    textContent: text,
    contacts: opts.contacts,
    scheduledAt: opts.scheduledAt,
  });
}

// ─── 19. Bulk platform update ─────────────────────────────────────────────────
//
// Send a maintenance / feature / critical notice to all users via the
// Campaigns API.
//
// Usage:
//   await sendBulkPlatformUpdate({
//     updateType: "maintenance",
//     title: "Scheduled Maintenance — Sunday 3 AM WAT",
//     description: "We will be performing ...",
//     startTime: "Sunday 20 Jul • 3:00 AM WAT",
//     endTime: "Sunday 20 Jul • 6:00 AM WAT",
//     affectedFeatures: ["Event registration", "Profile uploads"],
//     contacts: allUsers.map(u => ({ email: u.email, name: u.name })),
//   });

export async function sendBulkPlatformUpdate(
  opts: Omit<PlatformUpdateEmailOptions, "recipientName"> & {
    contacts: BrevoContact[];
    scheduledAt?: string;
  },
): Promise<{ campaignId: number }> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Bulk platform update (${opts.updateType})`);
    console.log(`  Title:      ${opts.title}`);
    console.log(`  Recipients: ${opts.contacts.length}`);
    if (opts.scheduledAt) console.log(`  Scheduled:  ${opts.scheduledAt}`);
    return { campaignId: 0 };
  }

  const { html, text, subject } = platformUpdateEmail({
    ...opts,
    recipientName: undefined, // omit personalisation for bulk
  });

  const { sendBulkCampaign } = await import("@/utils/mailer");
  return sendBulkCampaign({
    campaignName: `Platform update: ${opts.title}`,
    subject,
    sender: {
      name: "DIUSCADI",
      email: process.env.BREVO_SENDER_EMAIL ?? "info@diuscadi.org.ng",
    },
    htmlContent: html,
    textContent: text,
    contacts: opts.contacts,
    scheduledAt: opts.scheduledAt,
  });
}
