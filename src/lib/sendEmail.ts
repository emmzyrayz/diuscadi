// // lib/sendEmail.ts - V1
// //
// // Dev:  logs to console only — no SMTP env vars required.
// // Prod: sends real emails via nodemailer transporter.
// //
// // API routes import ONLY from here — never from MailTemplate.ts or mailer.ts directly.

// import {
//   verificationEmail,
//   resetPasswordEmail,
//   welcomeEmail,
//   schoolVerificationEmail,
//   eventRegistrationEmail,
//   eventReminderEmail,
//   applicationStatusEmail,
//   membershipWelcomeEmail,
//   guestVerificationEmail,
//   guestConfirmationEmail,
//   type EventRegistrationEmailOptions,
//   type EventReminderEmailOptions,
//   type ApplicationStatusEmailOptions,
//   type MembershipWelcomeEmailOptions,
//   type GuestVerificationEmailOptions,
//   type GuestConfirmationEmailOptions,
//   migrationWelcomeEmail,
//   broadcastEmail,
//   eventAnnouncementEmail,
//   platformUpdateEmail,
//   type BroadcastEmailOptions,
//   type EventAnnouncementEmailOptions,
//   type PlatformUpdateEmailOptions,
// } from "@/lib/MailTemplate";

// const IS_DEV =
//   process.env.NODE_ENV === "development" &&
//   process.env.SEND_REAL_EMAILS !== "true";
// const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// // Lazy-load mailer in production only.
// // mailer.ts throws at module load if SMTP env vars are missing —
// // dynamic import keeps dev completely isolated from it.
// async function prodSend(options: {
//   to: string;
//   subject: string;
//   html: string;
//   text: string;
// }): Promise<void> {
//   const { sendMail } = await import("@/utils/mailer");
//   await sendMail(options);
// }

// // ─── 1. Verification email ────────────────────────────────────────────────────

// export async function sendVerificationEmail(opts: {
//   to: string;
//   name: string;
//   code: string;
//   token: string;
// }): Promise<void> {
//   const verifyUrl = `${APP_URL}/auth/verify?token=${opts.token}&email=${encodeURIComponent(opts.to)}`;

//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Verification → ${opts.to}`);
//     console.log(`  Name:       ${opts.name}`);
//     console.log(`  OTP:        ${opts.code}`);
//     console.log(`  Magic link: ${verifyUrl}`);
//     return;
//   }

//   const { subject, html, text } = verificationEmail({
//     name: opts.name,
//     code: opts.code,
//     verifyUrl,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 2. Password reset email ──────────────────────────────────────────────────

// export async function sendResetPasswordEmail(opts: {
//   to: string;
//   name: string;
//   code: string;
//   token: string;
// }): Promise<void> {
//   const resetUrl = `${APP_URL}/auth/reset-password?token=${opts.token}&email=${encodeURIComponent(opts.to)}`;

//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Password reset → ${opts.to}`);
//     console.log(`  Name:      ${opts.name}`);
//     console.log(`  OTP:       ${opts.code}`);
//     console.log(`  Reset URL: ${resetUrl}`);
//     return;
//   }

//   const { subject, html, text } = resetPasswordEmail({
//     name: opts.name,
//     code: opts.code,
//     resetUrl,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 3. Welcome email (sent after successful verification) ────────────────────

// export async function sendWelcomeEmail(opts: {
//   to: string;
//   name: string;
//   role: string;
// }): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Welcome → ${opts.to}`);
//     console.log(`  Name: ${opts.name}`);
//     console.log(`  Role: ${opts.role}`);
//     return;
//   }

//   const { subject, html, text } = welcomeEmail({
//     name: opts.name,
//     role: opts.role,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 4. School email verification ────────────────────────────────────────────

// export async function sendSchoolVerificationEmail(opts: {
//   to: string;
//   name: string;
//   code: string;
// }): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] School email verification → ${opts.to}`);
//     console.log(`  Name:  ${opts.name}`);
//     console.log(`  OTP:   ${opts.code}`);
//     return;
//   }

//   const { subject, html, text } = schoolVerificationEmail({
//     name: opts.name,
//     code: opts.code,
//     schoolEmail: opts.to,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 5. Event registration confirmation ──────────────────────────────────────
// //
// // Called immediately after a successful event registration.
// // Requires the registration's inviteCode and the ticket's DB ID for the URL.

// export async function sendEventRegistrationEmail(
//   opts: {
//     to: string;
//     ticketId: string; // MongoDB _id of the eventRegistration document
//     whatsappGroupLink?: string;
//   } & Omit<EventRegistrationEmailOptions, "ticketUrl">,
// ): Promise<void> {
//   const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Event registration confirmation → ${opts.to}`);
//     console.log(`  Event:       ${opts.eventTitle}`);
//     console.log(`  Date:        ${opts.eventDate}`);
//     console.log(`  Location:    ${opts.eventLocation}`);
//     console.log(`  Ticket code: ${opts.ticketCode}`);
//     console.log(`  Ticket URL:  ${ticketUrl}`);
//      if (opts.whatsappGroupLink) {
//        // ← add
//        console.log(`  WhatsApp:    ${opts.whatsappGroupLink}`); // ← add
//      }
//     return;
//   }

//   const { subject, html, text } = eventRegistrationEmail({
//     name: opts.name,
//     eventTitle: opts.eventTitle,
//     eventDate: opts.eventDate,
//     eventLocation: opts.eventLocation,
//     ticketCode: opts.ticketCode,
//     ticketUrl,
//     isFree: opts.isFree,
//     ticketPrice: opts.ticketPrice,
//     whatsappGroupLink: opts.whatsappGroupLink,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 6. Event reminder ────────────────────────────────────────────────────────
// //
// // Intended to be called by a scheduled job (cron) ~24h before an event.
// // Pass hoursUntil=24 for the standard reminder. The function itself does
// // not schedule — the caller (cron route or job) is responsible for timing.

// export async function sendEventReminderEmail(
//   opts: {
//     to: string;
//     ticketId: string;
//   } & Omit<EventReminderEmailOptions, "ticketUrl">,
// ): Promise<void> {
//   const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Event reminder → ${opts.to}`);
//     console.log(`  Event:       ${opts.eventTitle}`);
//     console.log(`  Hours until: ${opts.hoursUntil}`);
//     console.log(`  Ticket code: ${opts.ticketCode}`);
//     return;
//   }

//   const { subject, html, text } = eventReminderEmail({
//     name: opts.name,
//     eventTitle: opts.eventTitle,
//     eventDate: opts.eventDate,
//     eventLocation: opts.eventLocation,
//     ticketCode: opts.ticketCode,
//     ticketUrl,
//     hoursUntil: opts.hoursUntil,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 7. Application status (approved or rejected) ────────────────────────────
// //
// // Generic — works for all 6 application types.
// // Pass status: "approved" | "rejected" and an optional reviewNote.
// // Pass ctaLabel + ctaUrl when there's a meaningful next action (e.g.
// // "View Your Profile" after membership approval, "Browse Events" after skills).

// export async function sendApplicationStatusEmail(
//   opts: {
//     to: string;
//   } & ApplicationStatusEmailOptions,
// ): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Application ${opts.status} → ${opts.to}`);
//     console.log(`  Type:   ${opts.applicationType}`);
//     console.log(`  Status: ${opts.status}`);
//     if (opts.reviewNote) console.log(`  Note:   ${opts.reviewNote}`);
//     return;
//   }

//   const { subject, html, text } = applicationStatusEmail({
//     name: opts.name,
//     applicationType: opts.applicationType,
//     status: opts.status,
//     reviewNote: opts.reviewNote,
//     ctaLabel: opts.ctaLabel,
//     ctaUrl: opts.ctaUrl,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 8. Membership approved welcome ──────────────────────────────────────────
// //
// // Richer, celebratory email sent specifically when a membership application
// // is approved — in addition to the generic application status email.
// // The two can be sent in sequence from the approval route:
// //   1. sendApplicationStatusEmail({ status: "approved", ... })
// //   2. sendMembershipWelcomeEmail({ ... })

// export async function sendMembershipWelcomeEmail(
//   opts: {
//     to: string;
//   } & MembershipWelcomeEmailOptions,
// ): Promise<void> {
//   const profileUrl = opts.profileUrl ?? `${APP_URL}/profile`;
//   const eventsUrl = opts.eventsUrl ?? `${APP_URL}/events`;

//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Membership welcome → ${opts.to}`);
//     console.log(`  Name:        ${opts.name}`);
//     console.log(`  Profile URL: ${profileUrl}`);
//     console.log(`  Events URL:  ${eventsUrl}`);
//     return;
//   }

//   const { subject, html, text } = membershipWelcomeEmail({
//     name: opts.name,
//     profileUrl,
//     eventsUrl,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 9. Contact form — internal notification ──────────────────────────────────

// export async function sendContactEnquiryEmail(opts: {
//   senderName: string;
//   senderEmail: string;
//   organisation?: string;
//   enquiryType: string;
//   subject: string;
//   message: string;
// }): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Contact enquiry → DIUSCADI inbox`);
//     console.log(`  From:    ${opts.senderName} <${opts.senderEmail}>`);
//     console.log(`  Type:    ${opts.enquiryType}`);
//     console.log(`  Subject: ${opts.subject}`);
//     console.log(`  Message: ${opts.message.slice(0, 80)}...`);
//     return;
//   }

//   const { contactEnquiryEmail } = await import("@/lib/MailTemplate");
//   const { subject, html, text } = contactEnquiryEmail(opts);
//   await prodSend({
//     to: process.env.CONTACT_INBOX_EMAIL ?? "info@diuscadi.org.ng",
//     subject,
//     html,
//     text,
//   });
// }

// // ─── 10. Contact form — auto-reply to sender ──────────────────────────────────

// export async function sendContactAutoReplyEmail(opts: {
//   to: string;
//   senderName: string;
//   enquiryType: string;
//   subject: string;
//   message: string;
// }): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Contact auto-reply → ${opts.to}`);
//     console.log(`  Name:    ${opts.senderName}`);
//     console.log(`  Subject: ${opts.subject}`);
//     return;
//   }

//   const { contactAutoReplyEmail } = await import("@/lib/MailTemplate");
//   const { subject, html, text } = contactAutoReplyEmail({
//     senderName: opts.senderName,
//     enquiryType: opts.enquiryType,
//     subject: opts.subject,
//     message: opts.message,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

 
// // ─── 11. Guest registration — OTP verification email ─────────────────────────
// //
// // Sent immediately after POST /api/events/register-guest.
// // Contains the 6-digit OTP and a magic verify link.
// // Registration is NOT complete until the guest verifies.
 
// export async function sendGuestVerificationEmail(opts: {
//   to: string;
//   name: string;
//   code: string;
//   eventTitle: string;
//   verifyUrl: string;
// }): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Guest verification → ${opts.to}`);
//     console.log(`  Name:       ${opts.name}`);
//     console.log(`  Event:      ${opts.eventTitle}`);
//     console.log(`  OTP:        ${opts.code}`);
//     console.log(`  Verify URL: ${opts.verifyUrl}`);
//     return;
//   }
 
//   const { subject, html, text } = guestVerificationEmail({
//     name: opts.name,
//     code: opts.code,
//     eventTitle: opts.eventTitle,
//     verifyUrl: opts.verifyUrl,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }
 
// // ─── 12. Guest registration — confirmation email (post-OTP) ──────────────────
// //
// // Sent after POST /api/events/verify-guest successfully marks verifiedAt.
// // Mirrors sendEventRegistrationEmail but labels the registration as "Guest"
// // and does not assume a platform account exists.
 
// export async function sendGuestConfirmationEmail(
//   opts: {
//     to: string;
//     ticketId: string; // MongoDB _id of the guestEventRegistration document
//     whatsappGroupLink?: string;
//   } & Omit<GuestConfirmationEmailOptions, "ticketUrl">,
// ): Promise<void> {
//   const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;
 
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Guest confirmation → ${opts.to}`);
//     console.log(`  Name:            ${opts.name}`);
//     console.log(`  Event:           ${opts.eventTitle}`);
//     console.log(`  Date:            ${opts.eventDate}`);
//     console.log(`  Location:        ${opts.eventLocation}`);
//     console.log(`  Ticket code:     ${opts.ticketCode}`);
//     console.log(`  Registration:    ${opts.registrationType}`);
//     console.log(`  Ticket URL:      ${ticketUrl}`);
//     if (opts.whatsappGroupLink) {
//       console.log(`  WhatsApp:        ${opts.whatsappGroupLink}`);
//     }
//     return;
//   }
 
//   const { subject, html, text } = guestConfirmationEmail({
//     name: opts.name,
//     eventTitle: opts.eventTitle,
//     eventDate: opts.eventDate,
//     eventLocation: opts.eventLocation,
//     ticketCode: opts.ticketCode,
//     ticketUrl,
//     isFree: opts.isFree,
//     ticketPrice: opts.ticketPrice,
//     whatsappGroupLink: opts.whatsappGroupLink,
//     registrationType: opts.registrationType,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // ADD TO src/lib/sendEmail.ts
// //
// // Step 1: Add to the import block at the top of sendEmail.ts:
// //
// //   import {
// //     ...existing imports...,
// //     migrationWelcomeEmail,
// //     type MigrationWelcomeEmailOptions,
// //   } from "@/lib/MailTemplate";
// //
// // Step 2: Paste the function below at the bottom of sendEmail.ts
// // ─────────────────────────────────────────────────────────────────────────────

// // ─── 13. Guest → Account migration welcome ───────────────────────────────────
// //
// // Sent after POST /api/auth/migrate-guest successfully creates the account.
// // Contains the temporary password and a direct link to the reset page.
// // This email is the ONLY place the temp password is ever transmitted.

// export async function sendMigrationWelcomeEmail(opts: {
//   to: string;
//   name: string;
//   tempPassword: string;
//   loginUrl: string;
//   resetUrl: string;
//   eventsCount: number;
// }): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Migration welcome → ${opts.to}`);
//     console.log(`  Name:          ${opts.name}`);
//     console.log(`  Temp password: ${opts.tempPassword}`);
//     console.log(`  Login URL:     ${opts.loginUrl}`);
//     console.log(`  Reset URL:     ${opts.resetUrl}`);
//     console.log(`  Tickets:       ${opts.eventsCount} migrated`);
//     return;
//   }

//   const { subject, html, text } = migrationWelcomeEmail({
//     name: opts.name,
//     tempPassword: opts.tempPassword,
//     loginUrl: opts.loginUrl,
//     resetUrl: opts.resetUrl,
//     eventsCount: opts.eventsCount,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 14. Broadcast email ──────────────────────────────────────────────────────
// //
// // Wraps admin-authored HTML in the DIUSCADI email shell and sends to one
// // recipient. Called in a loop by the broadcast send route (fire-and-forget).

// export async function sendBroadcastEmail(
//   opts: { to: string } & BroadcastEmailOptions,
// ): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Broadcast → ${opts.to}`);
//     console.log(`  Subject:   ${opts.subject}`);
//     if (opts.recipientName) console.log(`  Recipient: ${opts.recipientName}`);
//     if (opts.linkedEvent)   console.log(`  Event:     ${opts.linkedEvent.title}`);
//     return;
//   }

//   const { subject, html, text } = broadcastEmail({
//     subject:       opts.subject,
//     htmlContent:   opts.htmlContent,
//     textContent:   opts.textContent,
//     recipientName: opts.recipientName,
//     linkedEvent:   opts.linkedEvent,
//   });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 15. Event announcement email ─────────────────────────────────────────────
// //
// // Structured promotional email for an upcoming event — sent via broadcast
// // when a broadcast is linked to a specific event and the audience needs
// // rich event context rather than raw HTML.

// export async function sendEventAnnouncementEmail(
//   opts: { to: string } & EventAnnouncementEmailOptions,
// ): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Event announcement → ${opts.to}`);
//     console.log(`  Event:    ${opts.eventTitle}`);
//     console.log(`  Date:     ${opts.eventDate}`);
//     console.log(`  Location: ${opts.eventLocation}`);
//     console.log(`  Free:     ${opts.isFree}`);
//     if (opts.registrationDeadline)
//       console.log(`  Deadline: ${opts.registrationDeadline}`);
//     return;
//   }

//   const { subject, html, text } = eventAnnouncementEmail({ ...opts });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // ─── 16. Platform update / maintenance email ───────────────────────────────────
// //
// // Send ahead of maintenance windows, feature launches, or critical notices.
// // updateType controls icon + colour scheme (see PlatformUpdateType).

// export async function sendPlatformUpdateEmail(
//   opts: { to: string } & PlatformUpdateEmailOptions,
// ): Promise<void> {
//   if (IS_DEV) {
//     console.log(`[DEV EMAIL] Platform update (${opts.updateType}) → ${opts.to}`);
//     console.log(`  Title: ${opts.title}`);
//     if (opts.startTime) console.log(`  Start: ${opts.startTime}`);
//     if (opts.endTime)   console.log(`  End:   ${opts.endTime}`);
//     if (opts.affectedFeatures?.length)
//       console.log(`  Affects: ${opts.affectedFeatures.join(", ")}`);
//     if (opts.actionRequired) console.log(`  ⚠ Action required`);
//     return;
//   }

//   const { subject, html, text } = platformUpdateEmail({ ...opts });
//   await prodSend({ to: opts.to, subject, html, text });
// }

// // brevo - v2

// // // lib/sendEmail.ts
// // //
// // // Dev:  logs to console only — no SMTP env vars required.
// // // Prod: sends real emails via Brevo SMTP relay (transactional)
// // //       or Brevo Campaigns API (bulk/broadcast).
// // //
// // // API routes import ONLY from here — never from MailTemplate.ts or mailer.ts directly.

// // import {
// //   verificationEmail,
// //   resetPasswordEmail,
// //   welcomeEmail,
// //   schoolVerificationEmail,
// //   eventRegistrationEmail,
// //   eventReminderEmail,
// //   applicationStatusEmail,
// //   membershipWelcomeEmail,
// //   guestVerificationEmail,
// //   guestConfirmationEmail,
// //   migrationWelcomeEmail,
// //   broadcastEmail,
// //   eventAnnouncementEmail,
// //   platformUpdateEmail,
// //   type EventRegistrationEmailOptions,
// //   type EventReminderEmailOptions,
// //   type ApplicationStatusEmailOptions,
// //   type MembershipWelcomeEmailOptions,
// //   type GuestVerificationEmailOptions,
// //   type GuestConfirmationEmailOptions,
// //   type BroadcastEmailOptions,
// //   type EventAnnouncementEmailOptions,
// //   type PlatformUpdateEmailOptions,
// // } from "@/lib/MailTemplate";

// // const IS_DEV =
// //   process.env.NODE_ENV === "development" &&
// //   process.env.SEND_REAL_EMAILS !== "true";
// // const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// // // Lazy-load mailer in production only.
// // // mailer.ts throws at module load if Brevo env vars are missing —
// // // dynamic import keeps dev completely isolated from it.
// // async function prodSend(options: {
// //   to: string;
// //   subject: string;
// //   html: string;
// //   text: string;
// // }): Promise<void> {
// //   const { sendMail } = await import("@/utils/mailer");
// //   await sendMail(options);
// // }

// // // ─── 1. Verification email ────────────────────────────────────────────────────

// // export async function sendVerificationEmail(opts: {
// //   to: string;
// //   name: string;
// //   code: string;
// //   token: string;
// // }): Promise<void> {
// //   const verifyUrl = `${APP_URL}/auth/verify?token=${opts.token}&email=${encodeURIComponent(opts.to)}`;

// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Verification → ${opts.to}`);
// //     console.log(`  Name:       ${opts.name}`);
// //     console.log(`  OTP:        ${opts.code}`);
// //     console.log(`  Magic link: ${verifyUrl}`);
// //     return;
// //   }

// //   const { subject, html, text } = verificationEmail({
// //     name: opts.name,
// //     code: opts.code,
// //     verifyUrl,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 2. Password reset email ──────────────────────────────────────────────────

// // export async function sendResetPasswordEmail(opts: {
// //   to: string;
// //   name: string;
// //   code: string;
// //   token: string;
// // }): Promise<void> {
// //   const resetUrl = `${APP_URL}/auth/reset-password?token=${opts.token}&email=${encodeURIComponent(opts.to)}`;

// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Password reset → ${opts.to}`);
// //     console.log(`  Name:      ${opts.name}`);
// //     console.log(`  OTP:       ${opts.code}`);
// //     console.log(`  Reset URL: ${resetUrl}`);
// //     return;
// //   }

// //   const { subject, html, text } = resetPasswordEmail({
// //     name: opts.name,
// //     code: opts.code,
// //     resetUrl,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 3. Welcome email (sent after successful verification) ────────────────────

// // export async function sendWelcomeEmail(opts: {
// //   to: string;
// //   name: string;
// //   role: string;
// // }): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Welcome → ${opts.to}`);
// //     console.log(`  Name: ${opts.name}`);
// //     console.log(`  Role: ${opts.role}`);
// //     return;
// //   }

// //   const { subject, html, text } = welcomeEmail({
// //     name: opts.name,
// //     role: opts.role,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 4. School email verification ────────────────────────────────────────────

// // export async function sendSchoolVerificationEmail(opts: {
// //   to: string;
// //   name: string;
// //   code: string;
// // }): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] School email verification → ${opts.to}`);
// //     console.log(`  Name:  ${opts.name}`);
// //     console.log(`  OTP:   ${opts.code}`);
// //     return;
// //   }

// //   const { subject, html, text } = schoolVerificationEmail({
// //     name: opts.name,
// //     code: opts.code,
// //     schoolEmail: opts.to,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 5. Event registration confirmation ──────────────────────────────────────

// // export async function sendEventRegistrationEmail(
// //   opts: {
// //     to: string;
// //     ticketId: string;
// //     whatsappGroupLink?: string;
// //   } & Omit<EventRegistrationEmailOptions, "ticketUrl">,
// // ): Promise<void> {
// //   const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Event registration confirmation → ${opts.to}`);
// //     console.log(`  Event:       ${opts.eventTitle}`);
// //     console.log(`  Date:        ${opts.eventDate}`);
// //     console.log(`  Location:    ${opts.eventLocation}`);
// //     console.log(`  Ticket code: ${opts.ticketCode}`);
// //     console.log(`  Ticket URL:  ${ticketUrl}`);
// //     if (opts.whatsappGroupLink) {
// //       console.log(`  WhatsApp:    ${opts.whatsappGroupLink}`);
// //     }
// //     return;
// //   }

// //   const { subject, html, text } = eventRegistrationEmail({
// //     name: opts.name,
// //     eventTitle: opts.eventTitle,
// //     eventDate: opts.eventDate,
// //     eventLocation: opts.eventLocation,
// //     ticketCode: opts.ticketCode,
// //     ticketUrl,
// //     isFree: opts.isFree,
// //     ticketPrice: opts.ticketPrice,
// //     whatsappGroupLink: opts.whatsappGroupLink,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 6. Event reminder ────────────────────────────────────────────────────────

// // export async function sendEventReminderEmail(
// //   opts: {
// //     to: string;
// //     ticketId: string;
// //   } & Omit<EventReminderEmailOptions, "ticketUrl">,
// // ): Promise<void> {
// //   const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Event reminder → ${opts.to}`);
// //     console.log(`  Event:       ${opts.eventTitle}`);
// //     console.log(`  Hours until: ${opts.hoursUntil}`);
// //     console.log(`  Ticket code: ${opts.ticketCode}`);
// //     return;
// //   }

// //   const { subject, html, text } = eventReminderEmail({
// //     name: opts.name,
// //     eventTitle: opts.eventTitle,
// //     eventDate: opts.eventDate,
// //     eventLocation: opts.eventLocation,
// //     ticketCode: opts.ticketCode,
// //     ticketUrl,
// //     hoursUntil: opts.hoursUntil,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 7. Application status (approved or rejected) ────────────────────────────

// // export async function sendApplicationStatusEmail(
// //   opts: {
// //     to: string;
// //   } & ApplicationStatusEmailOptions,
// // ): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Application ${opts.status} → ${opts.to}`);
// //     console.log(`  Type:   ${opts.applicationType}`);
// //     console.log(`  Status: ${opts.status}`);
// //     if (opts.reviewNote) console.log(`  Note:   ${opts.reviewNote}`);
// //     return;
// //   }

// //   const { subject, html, text } = applicationStatusEmail({
// //     name: opts.name,
// //     applicationType: opts.applicationType,
// //     status: opts.status,
// //     reviewNote: opts.reviewNote,
// //     ctaLabel: opts.ctaLabel,
// //     ctaUrl: opts.ctaUrl,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 8. Membership approved welcome ──────────────────────────────────────────

// // export async function sendMembershipWelcomeEmail(
// //   opts: {
// //     to: string;
// //   } & MembershipWelcomeEmailOptions,
// // ): Promise<void> {
// //   const profileUrl = opts.profileUrl ?? `${APP_URL}/profile`;
// //   const eventsUrl = opts.eventsUrl ?? `${APP_URL}/events`;

// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Membership welcome → ${opts.to}`);
// //     console.log(`  Name:        ${opts.name}`);
// //     console.log(`  Profile URL: ${profileUrl}`);
// //     console.log(`  Events URL:  ${eventsUrl}`);
// //     return;
// //   }

// //   const { subject, html, text } = membershipWelcomeEmail({
// //     name: opts.name,
// //     profileUrl,
// //     eventsUrl,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 9. Contact form — internal notification ──────────────────────────────────

// // export async function sendContactEnquiryEmail(opts: {
// //   senderName: string;
// //   senderEmail: string;
// //   organisation?: string;
// //   enquiryType: string;
// //   subject: string;
// //   message: string;
// // }): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Contact enquiry → DIUSCADI inbox`);
// //     console.log(`  From:    ${opts.senderName} <${opts.senderEmail}>`);
// //     console.log(`  Type:    ${opts.enquiryType}`);
// //     console.log(`  Subject: ${opts.subject}`);
// //     console.log(`  Message: ${opts.message.slice(0, 80)}...`);
// //     return;
// //   }

// //   const { contactEnquiryEmail } = await import("@/lib/MailTemplate");
// //   const { subject, html, text } = contactEnquiryEmail(opts);
// //   await prodSend({
// //     to: process.env.CONTACT_INBOX_EMAIL ?? "info@diuscadi.org.ng",
// //     subject,
// //     html,
// //     text,
// //   });
// // }

// // // ─── 10. Contact form — auto-reply to sender ──────────────────────────────────

// // export async function sendContactAutoReplyEmail(opts: {
// //   to: string;
// //   senderName: string;
// //   enquiryType: string;
// //   subject: string;
// //   message: string;
// // }): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Contact auto-reply → ${opts.to}`);
// //     console.log(`  Name:    ${opts.senderName}`);
// //     console.log(`  Subject: ${opts.subject}`);
// //     return;
// //   }

// //   const { contactAutoReplyEmail } = await import("@/lib/MailTemplate");
// //   const { subject, html, text } = contactAutoReplyEmail({
// //     senderName: opts.senderName,
// //     enquiryType: opts.enquiryType,
// //     subject: opts.subject,
// //     message: opts.message,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 11. Guest registration — OTP verification email ─────────────────────────

// // export async function sendGuestVerificationEmail(opts: {
// //   to: string;
// //   name: string;
// //   code: string;
// //   eventTitle: string;
// //   verifyUrl: string;
// // }): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Guest verification → ${opts.to}`);
// //     console.log(`  Name:       ${opts.name}`);
// //     console.log(`  Event:      ${opts.eventTitle}`);
// //     console.log(`  OTP:        ${opts.code}`);
// //     console.log(`  Verify URL: ${opts.verifyUrl}`);
// //     return;
// //   }

// //   const { subject, html, text } = guestVerificationEmail({
// //     name: opts.name,
// //     code: opts.code,
// //     eventTitle: opts.eventTitle,
// //     verifyUrl: opts.verifyUrl,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 12. Guest registration — confirmation email (post-OTP) ──────────────────

// // export async function sendGuestConfirmationEmail(
// //   opts: {
// //     to: string;
// //     ticketId: string;
// //     whatsappGroupLink?: string;
// //   } & Omit<GuestConfirmationEmailOptions, "ticketUrl">,
// // ): Promise<void> {
// //   const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Guest confirmation → ${opts.to}`);
// //     console.log(`  Name:            ${opts.name}`);
// //     console.log(`  Event:           ${opts.eventTitle}`);
// //     console.log(`  Date:            ${opts.eventDate}`);
// //     console.log(`  Location:        ${opts.eventLocation}`);
// //     console.log(`  Ticket code:     ${opts.ticketCode}`);
// //     console.log(`  Registration:    ${opts.registrationType}`);
// //     console.log(`  Ticket URL:      ${ticketUrl}`);
// //     if (opts.whatsappGroupLink) {
// //       console.log(`  WhatsApp:        ${opts.whatsappGroupLink}`);
// //     }
// //     return;
// //   }

// //   const { subject, html, text } = guestConfirmationEmail({
// //     name: opts.name,
// //     eventTitle: opts.eventTitle,
// //     eventDate: opts.eventDate,
// //     eventLocation: opts.eventLocation,
// //     ticketCode: opts.ticketCode,
// //     ticketUrl,
// //     isFree: opts.isFree,
// //     ticketPrice: opts.ticketPrice,
// //     whatsappGroupLink: opts.whatsappGroupLink,
// //     registrationType: opts.registrationType,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 13. Guest → Account migration welcome ───────────────────────────────────

// // export async function sendMigrationWelcomeEmail(opts: {
// //   to: string;
// //   name: string;
// //   tempPassword: string;
// //   loginUrl: string;
// //   resetUrl: string;
// //   eventsCount: number;
// // }): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Migration welcome → ${opts.to}`);
// //     console.log(`  Name:          ${opts.name}`);
// //     console.log(`  Temp password: ${opts.tempPassword}`);
// //     console.log(`  Login URL:     ${opts.loginUrl}`);
// //     console.log(`  Reset URL:     ${opts.resetUrl}`);
// //     console.log(`  Tickets:       ${opts.eventsCount} migrated`);
// //     return;
// //   }

// //   const { subject, html, text } = migrationWelcomeEmail({
// //     name: opts.name,
// //     tempPassword: opts.tempPassword,
// //     loginUrl: opts.loginUrl,
// //     resetUrl: opts.resetUrl,
// //     eventsCount: opts.eventsCount,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 14. Broadcast email (single recipient, transactional) ───────────────────
// // //
// // // Wraps admin-authored HTML in the DIUSCADI email shell and sends to one
// // // recipient. Called in a loop by the broadcast send route (fire-and-forget).
// // // For large audiences, prefer sendBulkBroadcast() below.

// // export async function sendBroadcastEmail(
// //   opts: { to: string } & BroadcastEmailOptions,
// // ): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Broadcast → ${opts.to}`);
// //     console.log(`  Subject:   ${opts.subject}`);
// //     if (opts.recipientName) console.log(`  Recipient: ${opts.recipientName}`);
// //     if (opts.linkedEvent) console.log(`  Event:     ${opts.linkedEvent.title}`);
// //     return;
// //   }

// //   const { subject, html, text } = broadcastEmail({
// //     subject: opts.subject,
// //     htmlContent: opts.htmlContent,
// //     textContent: opts.textContent,
// //     recipientName: opts.recipientName,
// //     linkedEvent: opts.linkedEvent,
// //   });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 15. Event announcement email ─────────────────────────────────────────────

// // export async function sendEventAnnouncementEmail(
// //   opts: { to: string } & EventAnnouncementEmailOptions,
// // ): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Event announcement → ${opts.to}`);
// //     console.log(`  Event:    ${opts.eventTitle}`);
// //     console.log(`  Date:     ${opts.eventDate}`);
// //     console.log(`  Location: ${opts.eventLocation}`);
// //     console.log(`  Free:     ${opts.isFree}`);
// //     if (opts.registrationDeadline)
// //       console.log(`  Deadline: ${opts.registrationDeadline}`);
// //     return;
// //   }

// //   const { subject, html, text } = eventAnnouncementEmail({ ...opts });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ─── 16. Platform update / maintenance email ───────────────────────────────────

// // export async function sendPlatformUpdateEmail(
// //   opts: { to: string } & PlatformUpdateEmailOptions,
// // ): Promise<void> {
// //   if (IS_DEV) {
// //     console.log(
// //       `[DEV EMAIL] Platform update (${opts.updateType}) → ${opts.to}`,
// //     );
// //     console.log(`  Title: ${opts.title}`);
// //     if (opts.startTime) console.log(`  Start: ${opts.startTime}`);
// //     if (opts.endTime) console.log(`  End:   ${opts.endTime}`);
// //     if (opts.affectedFeatures?.length)
// //       console.log(`  Affects: ${opts.affectedFeatures.join(", ")}`);
// //     if (opts.actionRequired) console.log(`  ⚠ Action required`);
// //     return;
// //   }

// //   const { subject, html, text } = platformUpdateEmail({ ...opts });
// //   await prodSend({ to: opts.to, subject, html, text });
// // }

// // // ═══════════════════════════════════════════════════════════════════════════════
// // // BULK / CAMPAIGN SENDS  (Brevo Campaigns API)
// // // ═══════════════════════════════════════════════════════════════════════════════
// // //
// // // These functions use the Brevo Campaigns API instead of SMTP.
// // // Use them for large audiences (newsletters, event announcements to all members,
// // // platform-wide maintenance alerts, etc.).
// // //
// // // Key differences from the single-send helpers above:
// // //   • Personalisation  — limited to attributes available in the Brevo template.
// // //                        For per-recipient ticket codes, use the loop approach
// // //                        with sendBroadcastEmail() instead.
// // //   • Scheduling       — pass scheduledAt (ISO-8601) to queue ahead of time.
// // //   • Tracking         — opens, clicks, and unsubscribes are tracked by Brevo.
// // //   • Rate limits      — no per-email rate limit; Brevo handles queuing.
// // //   • Unsubscribes     — Brevo automatically appends a compliant footer with
// // //                        an unsubscribe link on every campaign email.

// // import type { BrevoContact } from "@/utils/mailer";

// // // ─── 17. Bulk broadcast (admin HTML content to a list of recipients) ──────────
// // //
// // // The most common bulk helper. Pass the same HTML you'd use in sendBroadcastEmail
// // // and a list of {email, name} objects. Brevo will queue and dispatch the campaign.
// // //
// // // Usage (e.g. from your admin broadcast route):
// // //
// // //   await sendBulkBroadcast({
// // //     campaignName: `Broadcast #${broadcastId}`,
// // //     subject: "Important update from DIUSCADI",
// // //     htmlContent: compiledHtml,
// // //     contacts: members.map(m => ({ email: m.email, name: m.name })),
// // //   });

// // export async function sendBulkBroadcast(opts: {
// //   campaignName: string;
// //   subject: string;
// //   htmlContent: string;
// //   textContent?: string;
// //   contacts: BrevoContact[];
// //   /** ISO-8601 schedule time. Omit to send immediately. */
// //   scheduledAt?: string;
// // }): Promise<{ campaignId: number }> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Bulk broadcast campaign`);
// //     console.log(`  Campaign:   ${opts.campaignName}`);
// //     console.log(`  Subject:    ${opts.subject}`);
// //     console.log(`  Recipients: ${opts.contacts.length}`);
// //     if (opts.scheduledAt) console.log(`  Scheduled:  ${opts.scheduledAt}`);
// //     return { campaignId: 0 };
// //   }

// //   const { sendBulkCampaign } = await import("@/utils/mailer");
// //   return sendBulkCampaign({
// //     campaignName: opts.campaignName,
// //     subject: opts.subject,
// //     sender: {
// //       name: "DIUSCADI",
// //       email: process.env.BREVO_SENDER_EMAIL ?? "info@diuscadi.org.ng",
// //     },
// //     htmlContent: opts.htmlContent,
// //     textContent: opts.textContent,
// //     contacts: opts.contacts,
// //     scheduledAt: opts.scheduledAt,
// //   });
// // }

// // // ─── 18. Bulk event announcement ─────────────────────────────────────────────
// // //
// // // Send the structured event announcement template to a large audience via
// // // the Campaigns API. Unlike sendEventAnnouncementEmail() (which loops over
// // // single SMTP sends), this creates one campaign and Brevo handles delivery.
// // //
// // // Usage:
// // //   await sendBulkEventAnnouncement({
// // //     eventTitle: "LASCADSS Annual Summit 2025",
// // //     eventDate: "Saturday, August 9 • 10:00 AM WAT",
// // //     eventLocation: "Main Auditorium, ABSU",
// // //     eventDescription: "Join us for the biggest ...",
// // //     eventUrl: "https://diuscadi.org.ng/events/summit-2025",
// // //     isFree: false,
// // //     ticketPrice: "₦2,500",
// // //     registrationDeadline: "Friday, August 1",
// // //     contacts: allMembers.map(m => ({ email: m.email, name: m.name })),
// // //   });

// // export async function sendBulkEventAnnouncement(
// //   opts: Omit<EventAnnouncementEmailOptions, "recipientName"> & {
// //     contacts: BrevoContact[];
// //     scheduledAt?: string;
// //   },
// // ): Promise<{ campaignId: number }> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Bulk event announcement`);
// //     console.log(`  Event:      ${opts.eventTitle}`);
// //     console.log(`  Recipients: ${opts.contacts.length}`);
// //     if (opts.scheduledAt) console.log(`  Scheduled:  ${opts.scheduledAt}`);
// //     return { campaignId: 0 };
// //   }

// //   // Build a single generic HTML (no per-recipient personalisation for campaigns)
// //   const { html, text, subject } = eventAnnouncementEmail({
// //     ...opts,
// //     recipientName: "Member", // generic salutation for bulk sends
// //   });

// //   const { sendBulkCampaign } = await import("@/utils/mailer");
// //   return sendBulkCampaign({
// //     campaignName: `Event: ${opts.eventTitle}`,
// //     subject,
// //     sender: {
// //       name: "DIUSCADI",
// //       email: process.env.BREVO_SENDER_EMAIL ?? "info@diuscadi.org.ng",
// //     },
// //     htmlContent: html,
// //     textContent: text,
// //     contacts: opts.contacts,
// //     scheduledAt: opts.scheduledAt,
// //   });
// // }

// // // ─── 19. Bulk platform update ─────────────────────────────────────────────────
// // //
// // // Send a maintenance / feature / critical notice to all users via the
// // // Campaigns API.
// // //
// // // Usage:
// // //   await sendBulkPlatformUpdate({
// // //     updateType: "maintenance",
// // //     title: "Scheduled Maintenance — Sunday 3 AM WAT",
// // //     description: "We will be performing ...",
// // //     startTime: "Sunday 20 Jul • 3:00 AM WAT",
// // //     endTime: "Sunday 20 Jul • 6:00 AM WAT",
// // //     affectedFeatures: ["Event registration", "Profile uploads"],
// // //     contacts: allUsers.map(u => ({ email: u.email, name: u.name })),
// // //   });

// // export async function sendBulkPlatformUpdate(
// //   opts: Omit<PlatformUpdateEmailOptions, "recipientName"> & {
// //     contacts: BrevoContact[];
// //     scheduledAt?: string;
// //   },
// // ): Promise<{ campaignId: number }> {
// //   if (IS_DEV) {
// //     console.log(`[DEV EMAIL] Bulk platform update (${opts.updateType})`);
// //     console.log(`  Title:      ${opts.title}`);
// //     console.log(`  Recipients: ${opts.contacts.length}`);
// //     if (opts.scheduledAt) console.log(`  Scheduled:  ${opts.scheduledAt}`);
// //     return { campaignId: 0 };
// //   }

// //   const { html, text, subject } = platformUpdateEmail({
// //     ...opts,
// //     recipientName: undefined, // omit personalisation for bulk
// //   });

// //   const { sendBulkCampaign } = await import("@/utils/mailer");
// //   return sendBulkCampaign({
// //     campaignName: `Platform update: ${opts.title}`,
// //     subject,
// //     sender: {
// //       name: "DIUSCADI",
// //       email: process.env.BREVO_SENDER_EMAIL ?? "info@diuscadi.org.ng",
// //     },
// //     htmlContent: html,
// //     textContent: text,
// //     contacts: opts.contacts,
// //     scheduledAt: opts.scheduledAt,
// //   });
// // }


// lib/sendEmail.ts — v3 (Resend)
//
// Dev:  logs to console only
// Prod: sends via Resend (transactional) or Resend Batch API (bulk)
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
}): Promise<BulkMailResult> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Bulk broadcast`);
    console.log(`  Campaign:   ${opts.campaignName}`);
    console.log(`  Subject:    ${opts.subject}`);
    console.log(`  Recipients: ${opts.contacts.length}`);
    return { sent: opts.contacts.length, failed: [] };
  }

  const { html, text } = broadcastEmail({
    subject:     opts.subject,
    htmlContent: opts.htmlContent,
    textContent: opts.textContent,
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