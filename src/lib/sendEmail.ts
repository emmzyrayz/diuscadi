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
  type GuestConfirmationEmailOptions,
  type BroadcastEmailOptions,
  type EventAnnouncementEmailOptions,
  type PlatformUpdateEmailOptions,
  GuestConfirmationWithAccountOptions,
  guestConfirmationWithAccountEmail,
  migrationOtpEmail,
} from "@/lib/MailTemplate";

const IS_DEV =
  process.env.NODE_ENV === "development" &&
  process.env.SEND_REAL_EMAILS !== "true";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── prodSend ─────────────────────────────────────────────────────────────────
// replyTo is now threaded through so it actually reaches the mailer.

async function prodSend(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
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

// ─── 3. Welcome email ─────────────────────────────────────────────────────────

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

// ─── 7. Application status ────────────────────────────────────────────────────

export async function sendApplicationStatusEmail(
  opts: { to: string } & ApplicationStatusEmailOptions,
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
  opts: { to: string } & MembershipWelcomeEmailOptions,
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
    // replies go back to the person who submitted the form
    replyTo: opts.senderEmail,
  });
}

// ─── 10. Contact form — auto-reply ───────────────────────────────────────────

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

// ─── 11. Guest verification email ─────────────────────────────────────────────

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

// ─── 12. Guest confirmation email ─────────────────────────────────────────────

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
    console.log(`  Name:         ${opts.name}`);
    console.log(`  Event:        ${opts.eventTitle}`);
    console.log(`  Date:         ${opts.eventDate}`);
    console.log(`  Location:     ${opts.eventLocation}`);
    console.log(`  Ticket code:  ${opts.ticketCode}`);
    console.log(`  Registration: ${opts.registrationType}`);
    console.log(`  Ticket URL:   ${ticketUrl}`);
    if (opts.whatsappGroupLink) {
      console.log(`  WhatsApp:     ${opts.whatsappGroupLink}`);
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

// ─── 13. Guest → Account migration welcome ────────────────────────────────────

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

// ─── 14. Broadcast (single recipient) ─────────────────────────────────────────

export async function sendBroadcastEmail(
  opts: { to: string } & BroadcastEmailOptions,
): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Broadcast → ${opts.to}`);
    console.log(`  Subject:   ${opts.subject}`);
    if (opts.recipientName) console.log(`  Recipient: ${opts.recipientName}`);
    if (opts.linkedEvent)   console.log(`  Event:     ${opts.linkedEvent.title}`);
    return;
  }

  const { subject, html, text } = broadcastEmail({
    subject:       opts.subject,
    htmlContent:   opts.htmlContent,
    textContent:   opts.textContent,
    recipientName: opts.recipientName,
    linkedEvent:   opts.linkedEvent,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 15. Event announcement (single recipient) ────────────────────────────────

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

// ─── 16. Platform update (single recipient) ───────────────────────────────────

export async function sendPlatformUpdateEmail(
  opts: { to: string } & PlatformUpdateEmailOptions,
): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Platform update (${opts.updateType}) → ${opts.to}`);
    console.log(`  Title: ${opts.title}`);
    if (opts.startTime) console.log(`  Start: ${opts.startTime}`);
    if (opts.endTime)   console.log(`  End:   ${opts.endTime}`);
    if (opts.affectedFeatures?.length)
      console.log(`  Affects: ${opts.affectedFeatures.join(", ")}`);
    if (opts.actionRequired) console.log(`  ⚠ Action required`);
    return;
  }

  const { subject, html, text } = platformUpdateEmail({ ...opts });
  await prodSend({ to: opts.to, subject, html, text });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BULK SENDS  (Resend Batch API — replaces Brevo Campaigns)
// ═══════════════════════════════════════════════════════════════════════════════
//
// These use sendBulkMail() from mailer.ts which chunks recipients into
// batches of 100 and calls resend.batch.send() per chunk.
//
// Key differences from the old Brevo bulk helpers:
//   • No campaign ID returned — Resend has no campaign concept, emails are
//     queued directly. Log the result.sent count instead.
//   • {{name}} and {{email}} merge tags work in html/text (see mailer.ts).
//   • Unsubscribe footer is NOT automatic — add one to your template HTML
//     if needed (e.g. link to /api/newsletter/unsubscribe?email={{email}}).
//   • Scheduling is not supported by Resend batch — send immediately or
//     trigger from a cron job at the right time.

export interface BulkContact {
  email: string;
  name?: string;
}

export interface BulkMailResult {
  sent: number;
  failed: { email: string; error: string }[];
}

// ─── 17. Bulk broadcast ───────────────────────────────────────────────────────
//
// Send admin-authored HTML to a list of recipients via Resend batch.
//
// Usage (from your admin broadcast route):
//
//   const result = await sendBulkBroadcast({
//     campaignName: `Broadcast #${broadcastId}`,
//     subject: "Important update from DIUSCADI",
//     htmlContent: compiledHtml,
//     contacts: members.map(m => ({ email: m.email, name: m.name })),
//   });
//   console.log(`Sent: ${result.sent}, Failed: ${result.failed.length}`);

export async function sendBulkBroadcast(opts: {
  campaignName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  contacts: BulkContact[];
  linkedEvent?: { title: string; eventDate: string; eventUrl?: string } | null;
}): Promise<BulkMailResult> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Bulk broadcast`);
    console.log(`  Campaign:   ${opts.campaignName}`);
    console.log(`  Subject:    ${opts.subject}`);
    console.log(`  Recipients: ${opts.contacts.length}`);
    if (opts.linkedEvent) console.log(`  Event: ${opts.linkedEvent.title}`);
    return { sent: opts.contacts.length, failed: [] };
  }

  // {{name}} merge tag → sendBulkMail in mailer.ts replaces it per recipient
  const { html, text } = broadcastEmail({
    subject:       opts.subject,
    htmlContent:   opts.htmlContent,
    textContent:   opts.textContent,
    recipientName: "{{name}}",
    linkedEvent:   opts.linkedEvent ?? null,
  });

  const { sendBulkMail } = await import("@/utils/mailer");
  return sendBulkMail({
    campaignName: opts.campaignName,
    subject:      opts.subject,
    html,
    text,
    recipients:   opts.contacts,
  });
}

// ─── 18. Bulk event announcement ──────────────────────────────────────────────
//
// Send the structured event announcement template to a large audience.
//
// Usage:
//   const result = await sendBulkEventAnnouncement({
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
    contacts: BulkContact[];
  },
): Promise<BulkMailResult> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Bulk event announcement`);
    console.log(`  Event:      ${opts.eventTitle}`);
    console.log(`  Recipients: ${opts.contacts.length}`);
    return { sent: opts.contacts.length, failed: [] };
  }

  // Build template once with {{name}} merge tag for per-recipient personalisation
  const { html, text, subject } = eventAnnouncementEmail({
    ...opts,
    recipientName: "{{name}}",
  });

  const { sendBulkMail } = await import("@/utils/mailer");
  return sendBulkMail({
    campaignName: `Event: ${opts.eventTitle}`,
    subject,
    html,
    text,
    recipients: opts.contacts,
  });
}

// ─── 19. Bulk platform update ─────────────────────────────────────────────────
//
// Send a maintenance / feature / critical notice to all users.
//
// Usage:
//   const result = await sendBulkPlatformUpdate({
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
    contacts: BulkContact[];
  },
): Promise<BulkMailResult> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Bulk platform update (${opts.updateType})`);
    console.log(`  Title:      ${opts.title}`);
    console.log(`  Recipients: ${opts.contacts.length}`);
    return { sent: opts.contacts.length, failed: [] };
  }

  const { html, text, subject } = platformUpdateEmail({
    ...opts,
    recipientName: "{{name}}",
  });

  const { sendBulkMail } = await import("@/utils/mailer");
  return sendBulkMail({
    campaignName: `Platform update: ${opts.title}`,
    subject,
    html,
    text,
    recipients: opts.contacts,
  });
}

// ─── 20. Guest confirmation + existing account notice ─────────────────────────────

export async function sendGuestConfirmationWithAccountEmail(
  opts: {
    to: string;
    ticketId: string;
    whatsappGroupLink?: string;
    forgotPasswordUrl: string;
  } & Omit<GuestConfirmationWithAccountOptions, "ticketUrl">,
): Promise<void> {
  const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Guest confirmation + account notice → ${opts.to}`);
    console.log(`  Event:        ${opts.eventTitle}`);
    console.log(`  Ticket code:  ${opts.ticketCode}`);
    console.log(`  Reset URL:    ${opts.forgotPasswordUrl}`);
    return;
  }

  const { subject, html, text } = guestConfirmationWithAccountEmail({
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
    forgotPasswordUrl: opts.forgotPasswordUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}


// ─── 21. Guest confirmation + existing account notice 

export async function sendGuestMigrationOtpEmail(opts: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Guest migration OTP → ${opts.to}`);
    console.log(`  Name: ${opts.name}`);
    console.log(`  OTP:  ${opts.code}`);
    return;
  }

  const { subject, html, text } = migrationOtpEmail({
    name: opts.name,
    code: opts.code,
  });
  await prodSend({ to: opts.to, subject, html, text });
}