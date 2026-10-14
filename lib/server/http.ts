import { NextRequest, NextResponse } from 'next/server';
import { HttpError } from './auth';
import { DatabaseNotConfiguredError } from './db';
import { StorageNotConfiguredError } from './blob';

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/** Wraps a route handler so thrown errors become consistent JSON responses. */
export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err: any) {
      if (err instanceof HttpError) return fail(err.message, err.status);
      if (err instanceof DatabaseNotConfiguredError || err instanceof StorageNotConfiguredError) return fail(err.message, 503);
      if (err?.name === 'MongoServerSelectionError' || err?.name === 'MongoNetworkError') {
        console.error('[api] database unreachable:', err?.message);
        return fail('The database is unreachable right now. Please try again shortly.', 503);
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname} failed:`, err);
      return fail('Something went wrong on our side. Please try again.', 500);
    }
  };
}

export function ok(data: Record<string, unknown> = {}, init?: ResponseInit) {
  return NextResponse.json({ success: true, ...data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function readJson<T = any>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'The request body must be valid JSON.');
  }
}

/** Trimmed string limited to `max` characters; empty string for non-strings. */
export function str(v: unknown, max = 500): string {
  if (typeof v !== 'string' && typeof v !== 'number') return '';
  return String(v).trim().slice(0, max);
}

/**
 * A video-call link pasted by a counsellor, mentor or admin (Google Meet, Zoom, Teams…).
 * Only web addresses are accepted so the Join button can never run script.
 * Returns '' for an empty value (link removed).
 */
export function meetingUrl(v: unknown): string {
  const s = str(v, 500);
  if (!s) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if ((url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.')) return url.toString();
  } catch {}
  throw new HttpError(400, 'Paste the full meeting link, for example https://meet.google.com/abc-defg-hij');
}

export function strList(v: unknown, maxItems = 30, maxLen = 120): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems);
}
