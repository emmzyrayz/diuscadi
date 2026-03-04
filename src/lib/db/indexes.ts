// lib/db/indexes.ts
// Run once after deploy: npx ts-node lib/db/indexes.ts

import { getDb } from "../mongodb";

export async function createIndexes() {
  const db = await getDb();

  // ── vault ──────────────────────────────────────────────────────────────────
  await db.collection("vault").createIndexes([
    { key: { email: 1 }, unique: true, name: "vault_email_unique" },
    {
      key: { "phone.phoneNumber": 1 },
      unique: true,
      name: "vault_phone_unique",
    },
    {
      key: { emailVerificationCode: 1 },
      sparse: true,
      name: "vault_email_otp",
    },
    {
      key: { emailVerificationToken: 1 },
      sparse: true,
      name: "vault_email_token",
    },
    {
      key: { phoneVerificationCode: 1 },
      sparse: true,
      name: "vault_phone_otp",
    },
    { key: { resetPasswordCode: 1 }, sparse: true, name: "vault_reset_otp" },
    { key: { resetPasswordToken: 1 }, sparse: true, name: "vault_reset_token" },
  ]);
  console.log("✓ vault indexes");

  // ── userData ───────────────────────────────────────────────────────────────
  await db.collection("userData").createIndexes([
    { key: { vaultId: 1 }, unique: true, name: "userData_vaultId_unique" },
    {
      key: { signupInviteCode: 1 },
      unique: true,
      sparse: true,
      name: "userData_inviteCode_unique",
    },
    {
      key: { schoolEmail: 1 },
      unique: true,
      sparse: true,
      name: "userData_schoolEmail_unique",
    },
  ]);
  console.log("✓ userData indexes");

  // ── sessions ───────────────────────────────────────────────────────────────
  await db.collection("sessions").createIndexes([
    { key: { token: 1 }, unique: true, name: "sessions_token_unique" },
    { key: { vaultId: 1 }, name: "sessions_vaultId" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "sessions_ttl" },
  ]);
  console.log("✓ sessions indexes");

  // ── applications ───────────────────────────────────────────────────────────
  await db.collection("applications").createIndexes([
    { key: { userId: 1 }, name: "applications_userId" },
    { key: { status: 1 }, name: "applications_status" },
    // Prevent duplicate pending applications for the same type+value per user
    {
      key: { userId: 1, type: 1, value: 1, status: 1 },
      unique: true,
      partialFilterExpression: { status: "pending" },
      name: "applications_no_duplicate_pending",
    },
  ]);
  console.log("✓ applications indexes");

  console.log("\nAll indexes created.");
}

if (require.main === module) {
  createIndexes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
