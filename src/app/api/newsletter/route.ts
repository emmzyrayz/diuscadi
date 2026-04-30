import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { sendMail } from "@/utils/mailer";
import { newsletterWelcomeEmail } from "@/lib/MailTemplate";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const col = Collections.newsletterSubscribers(db);

    // Check if already subscribed and active — avoid duplicate welcome emails
    const existing = await col.findOne({ email: email.toLowerCase() });

    await col.updateOne(
      { email: email.toLowerCase() },
      {
        $set: { active: true },
        $setOnInsert: { email: email.toLowerCase(), subscribedAt: new Date() },
      },
      { upsert: true },
    );

    // Only send welcome email if this is a new subscriber (or was inactive)
    if (!existing || !existing.active) {
      const { subject, html, text } = newsletterWelcomeEmail({ email });

      // Fire-and-forget — don't block the response on email delivery
      sendMail({ to: email, subject, html, text }).catch((e) =>
        console.error("[newsletter] sendMail failed:", e),
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/newsletter]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
