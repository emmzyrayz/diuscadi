import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const envCheck = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    MONGODB_DB: !!process.env.MONGODB_DB,
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_PORT: !!process.env.SMTP_PORT,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    EMAIL_FROM: !!process.env.EMAIL_FROM,
    JWT_SECRET: !!process.env.JWT_SECRET,
    MONGODB_URI_PREVIEW: process.env.MONGODB_URI
      ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ":<hidden>@")
      : "NOT SET",
    SMTP_HOST_VALUE: process.env.SMTP_HOST ?? "NOT SET",
    SMTP_PORT_VALUE: process.env.SMTP_PORT ?? "NOT SET",
    SMTP_USER_VALUE: process.env.SMTP_USER ?? "NOT SET",
  };

  const allEnvPresent = Object.values(envCheck)
    .filter((v) => typeof v === "boolean")
    .every(Boolean);

  if (!allEnvPresent) {
    return NextResponse.json(
      {
        status: "env_missing",
        message:
          "One or more env vars are missing. " +
          "Make sure .env.local is in your project root and restart the dev server.",
        env: envCheck,
      },
      { status: 500 },
    );
  }

  // ── MongoDB ───────────────────────────────────────────────────────────────
  const mongoResult = { ok: false, latencyMs: 0, error: "" };
  try {
    const { getDb } = await import("@/lib/mongodb");
    const start = Date.now();
    const db = await getDb();
    await db.command({ ping: 1 });
    mongoResult.ok = true;
    mongoResult.latencyMs = Date.now() - start;
  } catch (err: unknown) {
    mongoResult.error = err instanceof Error ? err.message : "Unknown error";
  }

  // ── SMTP ──────────────────────────────────────────────────────────────────
  const smtpResult = { ok: false, error: "" };
  try {
    const { verifySmtpConnection } = await import("@/utils/mailer");
    const ok = await verifySmtpConnection();
    smtpResult.ok = ok;
    if (!ok)
      smtpResult.error = "verify() returned false — check SMTP credentials";
  } catch (err: unknown) {
    smtpResult.error = err instanceof Error ? err.message : "Unknown error";
  }

  const allOk = mongoResult.ok && smtpResult.ok;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      env: envCheck,
      services: { mongodb: mongoResult, smtp: smtpResult },
    },
    { status: allOk ? 200 : 503 },
  );
}
