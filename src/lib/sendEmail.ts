// lib/sendEmail.ts
//
// Dev:  logs to console only — no SMTP env vars required.
// Prod: sends real emails via nodemailer transporter.
//
// API routes import only from here — never from mailer.ts or mailTemplate.ts directly.

import {
  verificationEmail,
  resetPasswordEmail,
  welcomeEmail,
} from "@/lib/MailTemplate";

const IS_DEV =
  process.env.NODE_ENV === "development" &&
  process.env.SEND_REAL_EMAILS !== "true";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Lazy-load mailer in production only.
// mailer.ts throws at module load if SMTP env vars are missing —
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