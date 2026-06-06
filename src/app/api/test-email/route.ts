import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse JSON safely
    let body: { to?: string } = {};
    const contentType = req.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    }

    const recipient = body.to || "info@diuscadi.org.ng";

    const { sendMail } = await import("@/utils/mailer");

    await sendMail({
      to: recipient,
      subject: "📧 DIUSCADI SMTP Test Email",
      html: `
        <h1 style="color: #0f172a;">✅ SMTP is Working!</h1>
        <p><strong>From:</strong> ${process.env.EMAIL_FROM}</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p>Your domain email setup is configured correctly.</p>
      `,
      text: "✅ SMTP is working! Your domain email setup is configured correctly.",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Test email sent to ${recipient}`,
        from: process.env.EMAIL_FROM,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[Test Email] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
