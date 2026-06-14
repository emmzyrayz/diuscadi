// // mailer V1

// import nodemailer, { Transporter, SendMailOptions } from "nodemailer";

// // ─── Validation ───────────────────────────────────────────────────────────────

// const REQUIRED_ENV = [
//   "SMTP_USER", // This will be: info.diuscadi@gmail.com
//   "SMTP_PASS", // This will be your 16-character Google App Password
//   "EMAIL_FROM", // E.g., '"DIUSCADI Ecosystem" <info.diuscadi@gmail.com>'
// ] as const;

// for (const key of REQUIRED_ENV) {
//   if (!process.env[key]) {
//     throw new Error(
//       `Missing environment variable "${key}". Add it to your .env.local file.`,
//     );
//   }
// }

// // ─── Transporter singleton ────────────────────────────────────────────────────

// declare global {
//   var _smtpTransporter: Transporter | undefined;
// }

// function createTransporter(): Transporter {
//   return nodemailer.createTransport({
//     service: "gmail", // Tells Nodemailer to automatically handle Google's secure defaults
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });
// }

// let transporter: Transporter;

// if (process.env.NODE_ENV === "development") {
//   if (!global._smtpTransporter) {
//     global._smtpTransporter = createTransporter();
//   }
//   transporter = global._smtpTransporter;
// } else {
//   transporter = createTransporter();
// }

// // ─── Base send helper ─────────────────────────────────────────────────────────

// export async function sendMail(options: SendMailOptions): Promise<void> {
//   await transporter.sendMail({
//     from: process.env.EMAIL_FROM,
//     ...options,
//   });
// }

// // ─── Verify connection (call during app health check / startup) ───────────────

// export async function verifySmtpConnection(): Promise<boolean> {
//   try {
//     await transporter.verify();
//     return true;
//   } catch (err) {
//     console.error("Gmail SMTP connection failed:", err);
//     return false;
//   }
// }


// // V2

// // // utils/mailer.ts
// // //
// // // Transactional emails  → Brevo SMTP relay  (smtp-relay.brevo.com:587)
// // // Bulk / campaign sends → Brevo Campaigns REST API  (v3)
// // //
// // // API routes import ONLY from lib/sendEmail.ts — never from here directly.

// // import nodemailer, { Transporter } from "nodemailer";

// // // ─── Validation ───────────────────────────────────────────────────────────────

// // const REQUIRED_ENV = [
// //   "BREVO_API_KEY",
// //   "BREVO_SMTP_USER",
// //   "EMAIL_FROM",
// // ] as const;

// // for (const key of REQUIRED_ENV) {
// //   if (!process.env[key]) {
// //     throw new Error(
// //       `Missing environment variable "${key}". Add it to your .env.local file.`,
// //     );
// //   }
// // }

// // // ─── Transporter singleton (SMTP relay) ──────────────────────────────────────
// // //
// // // Brevo SMTP relay authenticates with:
// // //   user  = your Brevo account login (the "Login" shown on your SMTP & API page)
// // //   pass  = an SMTP key generated in Brevo → SMTP & API → Generate SMTP key
// // //
// // // Do NOT use your Brevo account password here.

// // declare global {
// //   var _brevoTransporter: Transporter | undefined;
// // }

// // function createTransporter(): Transporter {
// //   return nodemailer.createTransport({
// //     host: "smtp-relay.brevo.com",
// //     port: 587,
// //     secure: false, // STARTTLS on port 587
// //     auth: {
// //       user: process.env.BREVO_SMTP_USER, // your Brevo login email
// //       pass: process.env.BREVO_SMTP_KEY, // SMTP key (not API key, not account password)
// //     },
// //   });
// // }

// // let transporter: Transporter;

// // if (process.env.NODE_ENV === "development") {
// //   if (!global._brevoTransporter) {
// //     global._brevoTransporter = createTransporter();
// //   }
// //   transporter = global._brevoTransporter;
// // } else {
// //   transporter = createTransporter();
// // }

// // // ─── Transactional send ───────────────────────────────────────────────────────

// // export interface SendMailOptions {
// //   to: string;
// //   subject: string;
// //   html: string;
// //   text: string;
// //   replyTo?: string;
// // }

// // export async function sendMail(options: SendMailOptions): Promise<void> {
// //   await transporter.sendMail({
// //     from: process.env.EMAIL_FROM, // e.g. '"DIUSCADI" <info@diuscadi.org.ng>'
// //     ...options,
// //   });
// // }

// // // ─── SMTP connection health check ─────────────────────────────────────────────

// // export async function verifySmtpConnection(): Promise<boolean> {
// //   try {
// //     await transporter.verify();
// //     return true;
// //   } catch (err) {
// //     console.error("Brevo SMTP connection failed:", err);
// //     return false;
// //   }
// // }

// // // ─── Brevo Campaigns API — types ─────────────────────────────────────────────

// // export interface BrevoContact {
// //   email: string;
// //   name?: string;
// //   attributes?: Record<string, string | number | boolean>;
// // }

// // export interface BrevoListImportResult {
// //   listId: number;
// //   /** Number of contacts successfully imported */
// //   total: number;
// // }

// // export interface BrevoCampaignOptions {
// //   /** Campaign display name (internal — not shown to recipients) */
// //   name: string;
// //   subject: string;
// //   /** Sender shown to recipients */
// //   sender: { name: string; email: string };
// //   /** Full HTML content of the email */
// //   htmlContent: string;
// //   /** Plain-text fallback */
// //   textContent?: string;
// //   /** Brevo contact list IDs to send to */
// //   listIds: number[];
// //   /**
// //    * ISO-8601 datetime to schedule the send, e.g. "2025-08-01T10:00:00+01:00"
// //    * Omit to send immediately after the campaign is created and sent via
// //    * sendCampaign().
// //    */
// //   scheduledAt?: string;
// // }

// // export interface BrevoCampaignResult {
// //   campaignId: number;
// // }

// // // ─── Brevo Campaigns API — helpers ───────────────────────────────────────────

// // const BREVO_BASE = "https://api.brevo.com/v3";

// // function brevoHeaders() {
// //   return {
// //     "api-key": process.env.BREVO_API_KEY!,
// //     "Content-Type": "application/json",
// //     Accept: "application/json",
// //   };
// // }

// // /**
// //  * Import a one-off list of contacts into Brevo and return the new list ID.
// //  * Used internally before creating a campaign so we can target an ad-hoc
// //  * audience without touching your permanent Brevo contact lists.
// //  *
// //  * The list is given a timestamped name so it can be cleaned up later from
// //  * the Brevo dashboard if needed.
// //  */
// // export async function importContactsToBrevo(
// //   contacts: BrevoContact[],
// //   listName?: string,
// // ): Promise<BrevoListImportResult> {
// //   const name = listName ?? `Bulk-${Date.now()}`;

// //   // 1. Create a new contact list
// //   const listRes = await fetch(`${BREVO_BASE}/contacts/lists`, {
// //     method: "POST",
// //     headers: brevoHeaders(),
// //     body: JSON.stringify({ name, folderId: 1 }),
// //   });

// //   if (!listRes.ok) {
// //     const err = await listRes.json().catch(() => ({}));
// //     throw new Error(`Brevo: failed to create list — ${JSON.stringify(err)}`);
// //   }

// //   const { id: listId } = (await listRes.json()) as { id: number };

// //   // 2. Upsert contacts into that list
// //   const importRes = await fetch(`${BREVO_BASE}/contacts/import`, {
// //     method: "POST",
// //     headers: brevoHeaders(),
// //     body: JSON.stringify({
// //       listIds: [listId],
// //       updateEnabled: true, // upsert — won't error on existing contacts
// //       jsonBody: contacts.map((c) => ({
// //         email: c.email,
// //         attributes: {
// //           ...(c.name ? { FIRSTNAME: c.name } : {}),
// //           ...c.attributes,
// //         },
// //       })),
// //     }),
// //   });

// //   if (!importRes.ok) {
// //     const err = await importRes.json().catch(() => ({}));
// //     throw new Error(
// //       `Brevo: failed to import contacts — ${JSON.stringify(err)}`,
// //     );
// //   }

// //   return { listId, total: contacts.length };
// // }

// // /**
// //  * Create a Brevo email campaign targeting the supplied list IDs.
// //  * Returns the campaignId — call sendCampaign() immediately after to dispatch.
// //  */
// // export async function createCampaign(
// //   opts: BrevoCampaignOptions,
// // ): Promise<BrevoCampaignResult> {
// //   const body: Record<string, unknown> = {
// //     name: opts.name,
// //     subject: opts.subject,
// //     sender: opts.sender,
// //     type: "classic",
// //     htmlContent: opts.htmlContent,
// //     ...(opts.textContent ? { textContent: opts.textContent } : {}),
// //     recipients: { listIds: opts.listIds },
// //     ...(opts.scheduledAt ? { scheduledAt: opts.scheduledAt } : {}),
// //   };

// //   const res = await fetch(`${BREVO_BASE}/emailCampaigns`, {
// //     method: "POST",
// //     headers: brevoHeaders(),
// //     body: JSON.stringify(body),
// //   });

// //   if (!res.ok) {
// //     const err = await res.json().catch(() => ({}));
// //     throw new Error(
// //       `Brevo: failed to create campaign — ${JSON.stringify(err)}`,
// //     );
// //   }

// //   const data = (await res.json()) as { id: number };
// //   return { campaignId: data.id };
// // }

// // /**
// //  * Trigger immediate send of a previously created campaign.
// //  * Only needed when scheduledAt was NOT passed to createCampaign().
// //  */
// // export async function sendCampaign(campaignId: number): Promise<void> {
// //   const res = await fetch(
// //     `${BREVO_BASE}/emailCampaigns/${campaignId}/sendNow`,
// //     {
// //       method: "POST",
// //       headers: brevoHeaders(),
// //     },
// //   );

// //   if (!res.ok) {
// //     const err = await res.json().catch(() => ({}));
// //     throw new Error(
// //       `Brevo: failed to send campaign ${campaignId} — ${JSON.stringify(err)}`,
// //     );
// //   }
// // }

// // /**
// //  * One-shot helper: import contacts → create campaign → send immediately.
// //  * Use this for ad-hoc bulk broadcasts (e.g. event announcements to a
// //  * non-permanent audience).
// //  *
// //  * For recurring or scheduled campaigns, use importContactsToBrevo +
// //  * createCampaign + sendCampaign individually so you can store the campaignId.
// //  */
// // export async function sendBulkCampaign(opts: {
// //   /** Internal name for this campaign (shows in Brevo dashboard) */
// //   campaignName: string;
// //   subject: string;
// //   sender: { name: string; email: string };
// //   htmlContent: string;
// //   textContent?: string;
// //   /** Recipients — imported as a one-off list */
// //   contacts: BrevoContact[];
// //   /** ISO-8601 schedule datetime; omit to send immediately */
// //   scheduledAt?: string;
// // }): Promise<BrevoCampaignResult> {
// //   const { listId } = await importContactsToBrevo(
// //     opts.contacts,
// //     opts.campaignName,
// //   );

// //   const { campaignId } = await createCampaign({
// //     name: opts.campaignName,
// //     subject: opts.subject,
// //     sender: opts.sender,
// //     htmlContent: opts.htmlContent,
// //     textContent: opts.textContent,
// //     listIds: [listId],
// //     scheduledAt: opts.scheduledAt,
// //   });

// //   if (!opts.scheduledAt) {
// //     await sendCampaign(campaignId);
// //   }

// //   return { campaignId };
// // }


// utils/mailer.ts
//
// Transactional email via Resend API.
// API routes import ONLY from lib/sendEmail.ts — never from here directly.

import { Resend } from "resend";

// ─── Validation ───────────────────────────────────────────────────────────────

const REQUIRED_ENV = ["RESEND_API_KEY", "MAIL_FROM"] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(
      `Missing environment variable "${key}". Add it to your .env.local file.`,
    );
  }
}

// ─── Resend singleton ─────────────────────────────────────────────────────────
// Hot-module-reload in dev would create a new client on every file change
// without the global cache — same pattern as the old nodemailer setup.

declare global {
  var _resendClient: Resend | undefined;
}

function createClient(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

let resend: Resend;

if (process.env.NODE_ENV === "development") {
  if (!global._resendClient) {
    global._resendClient = createClient();
  }
  resend = global._resendClient;
} else {
  resend = createClient();
}

// ─── Send helper (matches the interface sendEmail.ts expects) ─────────────────

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });

  if (error) {
    console.error("[sendMail] Resend error:", error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}