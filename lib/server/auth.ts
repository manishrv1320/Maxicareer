import crypto from 'node:crypto';
import { promisify } from 'node:util';
import type { NextRequest, NextResponse } from 'next/server';
import { col, COLLECTIONS, nowIso } from './db';

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export type UserRole = 'student' | 'counselor' | 'mentor' | 'staff';
export type StaffRole = 'Global admin' | 'Admin' | 'Content editor' | 'Counsellor' | 'Mentor';
export type UserStatus = 'active' | 'pending' | 'rejected' | 'disabled';

export interface UserDoc {
  _id: string;
  email: string;
  name: string;
  passwordHash?: string;
  role: UserRole;
  /** Present when the user can open the admin portal. */
  staffRole?: StaffRole;
  /** Id of the matching students / counselors / mentors document. */
  refId?: string;
  status: UserStatus;
  mustChangePassword?: boolean;
  isDemo?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  staffRole?: StaffRole;
  refId?: string;
  status: UserStatus;
  mustChangePassword?: boolean;
}

export const SESSION_COOKIE = 'mc_session';
const SESSION_DAYS = 14;

/* ------------------------------------------------------------------ */
/* Passwords                                                           */
/* ------------------------------------------------------------------ */

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltB64, keyB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 200) return 'Password is too long.';
  return null;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

/** Hash of an emailed one-time sign-in code. */
export const hashOtp = (email: string, code: string) => crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');

/** Password-reset links store only this hash, so a database leak can't reset accounts. */
export const hashResetToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const sessions = await col(COLLECTIONS.authSessions);
  await sessions.insertOne({ _id: hashToken(token) as any, userId, createdAt: nowIso(), expiresAt });
  const users = await col<UserDoc>(COLLECTIONS.users);
  await users.updateOne({ _id: userId }, { $set: { lastLoginAt: nowIso() } });
  return { token, expiresAt };
}

export function setSessionCookie(res: NextResponse, token: string, expiresAt: Date) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function destroySession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return;
  const sessions = await col(COLLECTIONS.authSessions);
  await sessions.deleteOne({ _id: hashToken(token) as any });
}

export async function destroyAllSessionsFor(userId: string) {
  const sessions = await col(COLLECTIONS.authSessions);
  await sessions.deleteMany({ userId });
}

/** Signs the account out everywhere except the browser making this request. */
export async function destroyOtherSessions(req: NextRequest, userId: string) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const sessions = await col(COLLECTIONS.authSessions);
  await sessions.deleteMany({ userId, ...(token ? { _id: { $ne: hashToken(token) as any } } : {}) });
}

/**
 * Sample accounts (clearly marked sample data with publicly known passwords) can only be
 * used when ENABLE_DEMO_LOGIN=true. Anywhere else they can't sign in or keep a session.
 */
export const demoLoginEnabled = () => process.env.ENABLE_DEMO_LOGIN === 'true';

/** Resolves the signed-in user from the session cookie, or null. */
export async function getCurrentUser(req: NextRequest): Promise<UserDoc | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sessions = await col<{ _id: string; userId: string; expiresAt: Date }>(COLLECTIONS.authSessions);
  const session = await sessions.findOne({ _id: hashToken(token) });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  const users = await col<UserDoc>(COLLECTIONS.users);
  const user = await users.findOne({ _id: session.userId });
  if (!user || user.status === 'disabled') return null;
  if (user.isDemo && !demoLoginEnabled()) return null;
  return user;
}

export function toPublicUser(u: UserDoc): PublicUser {
  return {
    id: u._id,
    email: u.email,
    name: u.name,
    role: u.role,
    staffRole: u.staffRole,
    refId: u.refId,
    status: u.status,
    mustChangePassword: u.mustChangePassword,
  };
}

/* ------------------------------------------------------------------ */
/* Permissions                                                         */
/* ------------------------------------------------------------------ */

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const isStaff = (u?: UserDoc | null) => Boolean(u && u.staffRole && u.status === 'active');
export const isAdmin = (u?: UserDoc | null) => Boolean(isStaff(u) && (u!.staffRole === 'Global admin' || u!.staffRole === 'Admin'));
export const canEditWebsite = (u?: UserDoc | null) => isAdmin(u) || (isStaff(u) && u!.staffRole === 'Content editor');
/** Staff who work with students. Content editors only manage the website, so they don't see student records. */
export const canSeeStudentData = (u?: UserDoc | null) => isStaff(u) && u!.staffRole !== 'Content editor';

export async function requireUser(req: NextRequest): Promise<UserDoc> {
  const user = await getCurrentUser(req);
  if (!user) throw new HttpError(401, 'Please sign in to continue.');
  return user;
}

export async function requireStaff(req: NextRequest): Promise<UserDoc> {
  const user = await requireUser(req);
  if (!isStaff(user)) throw new HttpError(403, 'Only Maxicareer staff can do that.');
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<UserDoc> {
  const user = await requireUser(req);
  if (!isAdmin(user)) throw new HttpError(403, 'Only administrators can do that.');
  return user;
}

export const normaliseEmail = (email: unknown) => String(email || '').trim().toLowerCase();

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ------------------------------------------------------------------ */
/* Basic in-memory rate limiting for public endpoints                  */
/* ------------------------------------------------------------------ */

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * The caller's IP for rate limiting. Headers set by the hosting platform come first; the
 * first X-Forwarded-For entry is whatever the client typed, so only the last one (added
 * by the nearest proxy) is used.
 */
export function clientIp(req: NextRequest) {
  const trusted = req.headers.get('x-nf-client-connection-ip') || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip');
  if (trusted) return trusted.trim();
  const chain = (req.headers.get('x-forwarded-for') || '').split(',').map((s) => s.trim()).filter(Boolean);
  return chain[chain.length - 1] || 'local';
}

/**
 * True only for a request typed on this computer (http://localhost). Requests through a
 * tunnel, proxy or the local network carry other hosts or forwarding headers.
 */
export function isLocalRequest(req: NextRequest) {
  if (['x-real-ip', 'cf-connecting-ip', 'x-nf-client-connection-ip', 'forwarded'].some((h) => req.headers.has(h))) return false;
  // Next.js fills X-Forwarded-For with the caller's address, so it may only name this computer.
  const loopback = /^(127\.\d+\.\d+\.\d+|::1|::ffff:127\.\d+\.\d+\.\d+)$/;
  const chain = (req.headers.get('x-forwarded-for') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (chain.some((ip) => !loopback.test(ip))) return false;
  const host = (req.headers.get('host') || '').replace(/:\d+$/, '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function rateLimit(req: NextRequest, bucket: string, limit: number, windowMs: number) {
  limitKey(`${bucket}:${clientIp(req)}`, limit, windowMs);
}

/** Drops expired counters so the map can't grow without limit. */
function pruneBuckets(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, entry] of buckets) if (entry.resetAt < now) buckets.delete(key);
}

/** Throws 429 if `key` has already passed `limit` events in its window (without counting). */
export function assertNotLimited(key: string, limit: number) {
  const entry = buckets.get(key);
  if (entry && entry.resetAt >= Date.now() && entry.count >= limit) {
    throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
  }
}

/** Forgets the count for `key` (e.g. failed sign-ins after a password reset). */
export function clearLimit(key: string) {
  buckets.delete(key);
}

/** Counts one event against `key`; throws 429 once `limit` is passed within the window. */
export function limitKey(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    pruneBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count++;
  if (entry.count > limit) throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
}
