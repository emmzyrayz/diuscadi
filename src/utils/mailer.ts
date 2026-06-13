import nodemailer, { Transporter, SendMailOptions } from "nodemailer";

// ─── Validation ───────────────────────────────────────────────────────────────

const REQUIRED_ENV = [
  "SMTP_USER", // This will be: info.diuscadi@gmail.com
  "SMTP_PASS", // This will be your 16-character Google App Password
  "EMAIL_FROM", // E.g., '"DIUSCADI Ecosystem" <info.diuscadi@gmail.com>'
] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(
      `Missing environment variable "${key}". Add it to your .env.local file.`,
    );
  }
}

// ─── Transporter singleton ────────────────────────────────────────────────────

declare global {
  var _smtpTransporter: Transporter | undefined;
}

function createTransporter(): Transporter {
  return nodemailer.createTransport({
    service: "gmail", // Tells Nodemailer to automatically handle Google's secure defaults
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
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
    console.error("Gmail SMTP connection failed:", err);
    return false;
  }
}
