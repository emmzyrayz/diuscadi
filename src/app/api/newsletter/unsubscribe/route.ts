import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  try {
    const db = await getDb();
    await Collections.newsletterSubscribers(db).updateOne(
      { email: email.toLowerCase() },
      { $set: { active: false } },
    );

    // Simple HTML confirmation page — no redirect needed
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Unsubscribed — DIUSCADI</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
          .card { background: white; border-radius: 24px; padding: 48px; text-align: center; max-width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
          h1 { font-size: 20px; color: #0f172a; margin-bottom: 12px; }
          p { color: #64748b; font-size: 14px; line-height: 1.6; }
          a { color: #0f172a; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size:40px;margin-bottom:16px;">👋</div>
          <h1>You've been unsubscribed.</h1>
          <p>We've removed <strong>${email}</strong> from the DIUSCADI mailing list. You won't hear from us again.</p>
          <p style="margin-top:24px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}">Back to DIUSCADI</a></p>
        </div>
      </body>
      </html>`,
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  } catch (err) {
    console.error("[newsletter/unsubscribe]", err);
    return new NextResponse("Something went wrong.", { status: 500 });
  }
}
