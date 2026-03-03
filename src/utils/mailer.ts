import nodemailer, { Transporter, SendMailOptions } from "nodemailer";

// ─── Validation ───────────────────────────────────────────────────────────────

const REQUIRED_ENV = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(
      `Missing environment variable "${key}". Add it to your .env.local file.`,
    );
  }
}

// ─── Transporter singleton ────────────────────────────────────────────────────
//
// Same hot-reload guard as mongodb.ts — caching on global prevents a new
// SMTP connection pool being created on every Next.js file-save in dev.

declare global {
  // eslint-disable-next-line no-var
  var _smtpTransporter: Transporter | undefined;
}

function createTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    // true for port 465 (SSL), false for port 587 (STARTTLS)
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Gracefully handle self-signed certs in dev (remove in production)
    ...(process.env.NODE_ENV === "development" && {
      tls: { rejectUnauthorized: false },
    }),
  });
}

let transporter: Transporter;

if (process.env.NODE_ENV === "development") {
  if (!global._smtpTransporter) {
    global._smtpTransporter = createTransporter();
  }
  transporter = global._smtpTransporter;
} else {
  transporter = createTransporter();
}

// ─── Base send helper ─────────────────────────────────────────────────────────

export async function sendMail(options: SendMailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    ...options,
  });
}

// ─── Verify connection (call during app health check / startup) ───────────────

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (err) {
    console.error("SMTP connection failed:", err);
    return false;
  }
}
