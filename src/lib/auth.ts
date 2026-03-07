// lib/auth.ts
// Auth utilities: JWT signing/verification, password hashing,
// token/OTP/invite code generation, and time helpers.

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET!;
const BCRYPT_ROUNDS = 12;

// ─── JWT ──────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  vaultId: string;
  sessionId: string;
  role: string;
  tokenVersion: number;
}

export function signJWT(payload: JWTPayload, expiresIn = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Token + OTP generators ───────────────────────────────────────────────────

/** Cryptographically secure URL-safe token (default 32 bytes → 64 hex chars) */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/** 6-digit numeric OTP */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** 6-char alphanumeric invite/signup code (uppercase) */
export function generateInviteCode(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

export function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function hoursFromNow(hours: number): Date {
  return minutesFromNow(hours * 60);
}
