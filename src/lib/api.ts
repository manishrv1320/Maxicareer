import { useEffect, useState } from 'react';

/** Thin fetch wrapper for the Maxicareer API. Throws ApiError with the server's message. */

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function parse<T>(res: Response): Promise<T> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {}
  if (!res.ok || body?.success === false) {
    throw new ApiError(body?.message || `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

export async function apiGet<T = any>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { credentials: 'same-origin', cache: 'no-store' }));
}

export async function apiSend<T = any>(url: string, body?: unknown, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'): Promise<T> {
  return parse<T>(
    await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  );
}

export interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  contentType: string;
}

export type UploadCategory = 'avatar' | 'website' | 'attachment' | 'document' | 'resource';

/** Uploads a file to Azure Blob Storage through /api/files. */
export async function uploadFile(file: File, category: UploadCategory): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  form.append('category', category);
  const res = await parse<{ data: UploadedFile }>(await fetch('/api/files', { method: 'POST', body: form, credentials: 'same-origin' }));
  return res.data;
}

/** Opens a file picker and resolves with the chosen file (or null if cancelled). */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'counselor' | 'mentor' | 'staff';
  staffRole?: 'Global admin' | 'Admin' | 'Content editor' | 'Counsellor' | 'Mentor';
  refId?: string;
  status: string;
  mustChangePassword?: boolean;
}

let demoAvailable: Promise<boolean> | null = null;

/** Whether one-click sample student accounts can be used right now. */
export function useDemoAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    demoAvailable ??= apiGet<{ demoAvailable?: boolean }>('/api/auth/me')
      .then((r) => Boolean(r.demoAvailable))
      .catch(() => false);
    let live = true;
    demoAvailable.then((v) => live && setAvailable(v));
    return () => {
      live = false;
    };
  }, []);
  return available;
}

/** A sample account listed on /login while sample data is loaded. */
export interface SampleLogin {
  role: 'Student' | 'Counsellor' | 'Mentor' | 'Admin';
  name: string;
  email: string;
  password: string;
  note: string;
}

export const auth = {
  /** `home` is the dashboard this account lands on (/?portal=student, /portal or /admin). */
  me: () =>
    apiGet<{ user: SessionUser | null; student: any; configured: boolean; demoAvailable?: boolean; home?: string; sampleLogins?: SampleLogin[] }>('/api/auth/me'),
  /** portal 'auto' accepts any active account (the shared /login page). */
  login: (email: string, password: string, portal: 'student' | 'counselor' | 'mentor' | 'admin' | 'auto') =>
    apiSend<{ user: SessionUser; student: any; home: string }>('/api/auth/login', { email, password, portal }),
  logout: () => apiSend('/api/auth/logout'),
  register: (data: Record<string, unknown>) => apiSend<{ user: SessionUser; student: any; home: string; linkedExistingRecord?: boolean }>('/api/auth/register', data),
  requestCode: (email: string) => apiSend<{ message: string; devCode?: string }>('/api/auth/code/request', { email }),
  verifyCode: (email: string, code: string, profession?: string) =>
    apiSend<{ user: SessionUser; student: any; home: string }>('/api/auth/code/verify', { email, code, profession }),
  demoLogin: (profession: string) => apiSend<{ user: SessionUser; student: any }>('/api/auth/demo-login', { profession }),
  changePassword: (currentPassword: string, newPassword: string) => apiSend('/api/auth/password', { currentPassword, newPassword }),
  /** Emails a reset link from the support address (same answer whether or not the account exists). */
  forgotPassword: (email: string) => apiSend<{ message: string }>('/api/auth/password/forgot', { email }),
  checkResetLink: (token: string) => apiGet<{ email: string }>(`/api/auth/password/reset?token=${encodeURIComponent(token)}`),
  /** `home` is set when the new password also signed the person in. */
  resetPassword: (token: string, newPassword: string) => apiSend<{ message: string; home?: string }>('/api/auth/password/reset', { token, newPassword }),
};
