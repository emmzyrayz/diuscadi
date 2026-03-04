// lib/db/indexes.ts
// Run once after deploy: npx ts-node --project tsconfig.json lib/db/indexes.ts

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
  console.log("✓ vault");

  // ── userData ───────────────────────────────────────────────────────────────
  await db.collection("userData").createIndexes([
    { key: { vaultId: 1 }, unique: true, name: "userData_vaultId" },
    {
      key: { signupInviteCode: 1 },
      unique: true,
      sparse: true,
      name: "userData_inviteCode",
    },
    {
      key: { schoolEmail: 1 },
      unique: true,
      sparse: true,
      name: "userData_schoolEmail",
    },
  ]);
  console.log("✓ userData");

  // ── sessions ───────────────────────────────────────────────────────────────
  await db.collection("sessions").createIndexes([
    { key: { token: 1 }, unique: true, name: "sessions_token" },
    { key: { vaultId: 1 }, name: "sessions_vaultId" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "sessions_ttl" },
  ]);
  console.log("✓ sessions");

  // ── applications ───────────────────────────────────────────────────────────
  await db.collection("applications").createIndexes([
    { key: { userId: 1 }, name: "applications_userId" },
    { key: { status: 1 }, name: "applications_status" },
    {
      key: { userId: 1, type: 1, value: 1, status: 1 },
      unique: true,
      partialFilterExpression: { status: "pending" },
      name: "applications_no_duplicate_pending",
    },
  ]);
  console.log("✓ applications");

  // ── events ─────────────────────────────────────────────────────────────────
  await db.collection("events").createIndexes([
    { key: { slug: 1 }, unique: true, name: "events_slug" },
    { key: { status: 1 }, name: "events_status" },
    { key: { eventDate: 1 }, name: "events_eventDate" },
    { key: { registrationDeadline: 1 }, name: "events_regDeadline" },
    { key: { targetEduStatus: 1 }, name: "events_targetEduStatus" },
    { key: { locationScope: 1 }, name: "events_locationScope" },
    { key: { requiredSkills: 1 }, name: "events_skills" },
    { key: { category: 1 }, name: "events_category" },
  ]);
  console.log("✓ events");

  // ── ticketTypes ────────────────────────────────────────────────────────────
  await db.collection("ticketTypes").createIndexes([
    { key: { eventId: 1 }, name: "ticketTypes_eventId" },
    { key: { eventId: 1, name: 1 }, name: "ticketTypes_eventId_name" },
  ]);
  console.log("✓ ticketTypes");

  // ── eventRegistrations ─────────────────────────────────────────────────────
  await db.collection("eventRegistrations").createIndexes([
    // Prevent duplicate registration for same user + event
    {
      key: { userId: 1, eventId: 1 },
      unique: true,
      name: "reg_user_event_unique",
    },
    { key: { inviteCode: 1 }, unique: true, name: "reg_inviteCode_unique" },
    { key: { eventId: 1 }, name: "reg_eventId" },
    { key: { userId: 1 }, name: "reg_userId" },
    { key: { status: 1 }, name: "reg_status" },
    // Referral tracking
    { key: { referralCodeUsed: 1 }, sparse: true, name: "reg_referral" },
  ]);
  console.log("✓ eventRegistrations");

  console.log("\n✅ All indexes created.");
}

if (require.main === module) {
  createIndexes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
