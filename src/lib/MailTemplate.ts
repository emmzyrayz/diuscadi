// ─── Email templates ──────────────────────────────────────────────────────────
//
// Plain HTML strings intentionally — no template engine dependency.
// The wrapper() helper provides the shared shell; each template fills in
// the content block. Inline styles are used because many email clients
// strip <style> blocks.

const APP_NAME = "DIUSCADI";
const PRIMARY_COLOR = "#0f172a"; // slate-900
const ACCENT_COLOR = "#facc15"; // primary yellow (match your Tailwind primary)

function wrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:${PRIMARY_COLOR};padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:${ACCENT_COLOR};border-radius:12px;padding:10px 14px;margin-bottom:16px;">
                <span style="font-size:20px;">⬡</span>
              </div>
              <div style="color:#ffffff;font-size:11px;font-weight:900;letter-spacing:0.25em;text-transform:uppercase;">
                ${APP_NAME} Ecosystem
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;font-weight:700;">
                This email was sent by ${APP_NAME}. If you didn't request this, ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Shared OTP block ─────────────────────────────────────────────────────────

function otpBlock(code: string): string {
  return `
    <div style="margin:28px 0;text-align:center;">
      <div style="display:inline-block;background:#f8fafc;border:2px solid #e2e8f0;border-radius:16px;padding:20px 32px;">
        <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.25em;margin-bottom:8px;">
          Your Code
        </div>
        <div style="font-size:36px;font-weight:900;color:${PRIMARY_COLOR};letter-spacing:0.3em;">
          ${code}
        </div>
      </div>
      <p style="margin:12px 0 0;font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
        Expires in 15 minutes
      </p>
    </div>
  `;
}

function ctaButton(label: string, href: string): string {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${href}"
         style="display:inline-block;background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;
                font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;
                padding:14px 32px;border-radius:12px;">
        ${label}
      </a>
      <p style="margin:12px 0 0;font-size:9px;color:#94a3b8;">
        Or copy this link: <span style="color:${PRIMARY_COLOR};word-break:break-all;">${href}</span>
      </p>
    </div>
  `;
}

// ─── 1. Email Verification ────────────────────────────────────────────────────

interface VerificationEmailOptions {
  name: string;
  code: string;
  verifyUrl: string;
}

export function verificationEmail({
  name,
  code,
  verifyUrl,
}: VerificationEmailOptions) {
  const subject = `${APP_NAME} — Verify your account`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      Verify Your Account
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Welcome, ${name}
    </p>
    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      Use the 6-digit code below <strong>or</strong> click the button to instantly
      verify your campus account. Use whichever arrives first in your workflow.
    </p>

    ${otpBlock(code)}

    <div style="text-align:center;margin:8px 0 20px;">
      <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:16px;">
        — or verify instantly —
      </div>
    </div>

    ${ctaButton("Verify My Account", verifyUrl)}
  `);

  const text = `Hi ${name},\n\nYour DIUSCADI verification code is: ${code}\n\nOr click this link: ${verifyUrl}\n\nExpires in 15 minutes.`;

  return { subject, html, text };
}

// ─── 2. Password Reset ────────────────────────────────────────────────────────

interface ResetEmailOptions {
  name: string;
  code: string;
  resetUrl: string;
}

export function resetPasswordEmail({
  name,
  code,
  resetUrl,
}: ResetEmailOptions) {
  const subject = `${APP_NAME} — Reset your password`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      Reset Your Password
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Hi, ${name}
    </p>
    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      We received a request to reset your password. Enter the 6-digit code on the
      reset page <strong>or</strong> click the button below to go directly to the
      new password step.
    </p>

    ${otpBlock(code)}

    <div style="text-align:center;margin:8px 0 20px;">
      <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:16px;">
        — or reset instantly —
      </div>
    </div>

    ${ctaButton("Set New Password", resetUrl)}

    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will not change.
    </p>
  `);

  const text = `Hi ${name},\n\nYour DIUSCADI password reset code is: ${code}\n\nOr click this link: ${resetUrl}\n\nExpires in 15 minutes.\n\nIf you didn't request this, ignore this email.`;

  return { subject, html, text };
}

// ─── 3. Welcome (post-verification) ──────────────────────────────────────────

interface WelcomeEmailOptions {
  name: string;
  role: string;
}

export function welcomeEmail({ name, role }: WelcomeEmailOptions) {
  const subject = `${APP_NAME} — Your account is ready`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      You're In.
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Welcome to the ecosystem, ${name}
    </p>
    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      Your account has been verified and you're all set to access the
      <strong>DIUSCADI Ecosystem</strong> as a
      <strong>${role.charAt(0) + role.slice(1).toLowerCase()}</strong>.
    </p>
    ${ctaButton("Go to Home", `${process.env.NEXT_PUBLIC_APP_URL}/home`)}
  `);

  const text = `Welcome to DIUSCADI, ${name}!\n\nYour account is verified. Sign in at: ${process.env.NEXT_PUBLIC_APP_URL}/auth`;

  return { subject, html, text };
}