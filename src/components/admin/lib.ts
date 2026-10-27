import { useCallback, useEffect, useRef, useState, useSyncExternalStore, SetStateAction } from 'react';
import { apiGet, apiSend } from '../../lib/api';

/* ------------------------------------------------------------------ */
/* Shared admin data (MongoDB through /api/admin/*)                    */
/* ------------------------------------------------------------------ */

let reportSharedError: (message: string) => void = (m) => console.warn('[admin-data]', m);

/** Lets the admin shell show sync failures as toasts. */
export function setSharedErrorHandler(fn: (message: string) => void) {
  reportSharedError = fn;
}

const ORDERED_COLLECTIONS = new Set(['templates', 'services']);

type Listener = () => void;

/** One cached admin collection, shared by every component that uses it. */
class SharedCollection<T extends { id: string }> {
  items: T[];
  private listeners = new Set<Listener>();
  private loading: Promise<void> | null = null;
  private pending = 0;
  loaded = false;

  constructor(private key: string, private initial: T[]) {
    this.items = initial;
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  get = () => this.items;

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private get url() {
    return `/api/admin/data/${this.key}`;
  }

  private withOrder(list: T[]) {
    return ORDERED_COLLECTIONS.has(this.key) ? list.map((item, i) => ({ ...item, _order: i })) : list;
  }

  load(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const res = await apiGet<{ items: T[]; initialized: boolean }>(this.url);
      if (!res.initialized && this.initial.length) {
        // First run: store the built-in defaults (e.g. roadmap templates) once.
        await apiSend(this.url, { upserts: this.withOrder(this.initial), deletes: [] });
        this.items = this.initial;
      } else if (this.pending === 0) {
        this.items = res.items;
      }
      this.loaded = true;
      this.emit();
    })()
      .catch((err) => reportSharedError(err instanceof Error ? err.message : 'Could not load data.'))
      .finally(() => {
        this.loading = null;
      });
    return this.loading;
  }

  /** Applies a change locally, then sends only the added/changed/removed items. */
  set = (next: SetStateAction<T[]>) => {
    const prev = this.items;
    const value = typeof next === 'function' ? (next as (p: T[]) => T[])(prev) : next;
    if (value === prev) return;
    this.items = value;
    this.emit();

    const ordered = ORDERED_COLLECTIONS.has(this.key);
    const before = new Map(prev.map((item, i) => [item.id, JSON.stringify(ordered ? { ...item, _order: i } : item)]));
    const upserts = this.withOrder(value).filter((item) => before.get(item.id) !== JSON.stringify(item));
    const keep = new Set(value.map((i) => i.id));
    const deletes = prev.filter((i) => !keep.has(i.id)).map((i) => i.id);
    if (!upserts.length && !deletes.length) return;

    this.pending++;
    apiSend(this.url, { upserts, deletes })
      .catch((err) => {
        reportSharedError(err instanceof Error ? err.message : 'Could not save your change.');
        this.load();
      })
      .finally(() => {
        this.pending--;
      });
  };
}

/** One cached admin setting (a single JSON value), saved after a short pause in edits. */
class SharedValue<T> {
  value: T;
  private listeners = new Set<Listener>();
  private loading: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;

  constructor(private key: string, initial: T) {
    this.value = initial;
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  get = () => this.value;

  private emit() {
    this.listeners.forEach((l) => l());
  }

  load(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = apiGet<{ exists: boolean; value: T }>(`/api/admin/settings/${this.key}`)
      .then((res) => {
        if (res.exists && !this.dirty) {
          this.value = res.value;
          this.emit();
        }
      })
      .catch((err) => reportSharedError(err instanceof Error ? err.message : 'Could not load settings.'))
      .finally(() => {
        this.loading = null;
      });
    return this.loading;
  }

  set = (next: SetStateAction<T>) => {
    this.value = typeof next === 'function' ? (next as (p: T) => T)(this.value) : next;
    this.dirty = true;
    this.emit();
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 500);
  };

  flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (!this.dirty) return;
    this.dirty = false;
    apiSend(`/api/admin/settings/${this.key}`, { value: this.value }, 'PUT').catch((err) =>
      reportSharedError(err instanceof Error ? err.message : 'Could not save your change.')
    );
  }
}

const collections = new Map<string, SharedCollection<any>>();
const values = new Map<string, SharedValue<any>>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => values.forEach((v) => v.flush()));
}

/** Reloads a shared collection from the server (after the server changed it itself). */
export function refreshShared(key: string) {
  return collections.get(key)?.load();
}

/** Forget cached admin data (call on sign-out so the next admin starts clean). */
export function resetSharedData() {
  values.forEach((v) => v.flush());
  collections.clear();
  values.clear();
}

/**
 * Like useState for an admin collection stored in MongoDB. `initial` is written
 * to the database the first time the collection is used (built-in defaults).
 */
export function useSharedCollection<T extends { id: string }>(key: string, initial: T[] = [], opts: { enabled?: boolean; refreshMs?: number } = {}) {
  let store = collections.get(key) as SharedCollection<T> | undefined;
  if (!store) {
    store = new SharedCollection<T>(key, initial);
    collections.set(key, store);
  }
  const items = useSyncExternalStore(store.subscribe, store.get, store.get);
  const enabled = opts.enabled !== false;

  useEffect(() => {
    if (!enabled) return;
    store!.load();
    if (!opts.refreshMs) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') store!.load();
    }, opts.refreshMs);
    return () => clearInterval(t);
  }, [store, enabled, opts.refreshMs]);

  return [items, store.set] as const;
}

/** A Record keyed by id, stored as one document per entry. */
export function useSharedRecord<V>(key: string, opts: { enabled?: boolean } = {}) {
  const [items, setItems] = useSharedCollection<V & { id: string }>(key, [], opts);
  const record = useRecordView(items);
  const setRecord = useCallback(
    (next: SetStateAction<Record<string, V>>) => {
      setItems((prevItems) => {
        const prev = Object.fromEntries(prevItems.map(({ id, ...rest }) => [id, rest as unknown as V]));
        const value = typeof next === 'function' ? (next as (p: Record<string, V>) => Record<string, V>)(prev) : next;
        return Object.entries(value).map(([id, v]) => ({ ...(v as object), id }) as V & { id: string });
      });
    },
    [setItems]
  );
  return [record, setRecord] as const;
}

function useRecordView<V>(items: (V & { id: string })[]) {
  const cache = useRef<{ items: unknown; record: Record<string, V> }>({ items: null, record: {} });
  if (cache.current.items !== items) {
    cache.current = { items, record: Object.fromEntries(items.map(({ id, ...rest }) => [id, rest as unknown as V])) };
  }
  return cache.current.record;
}

/** Like useState for one admin setting stored in MongoDB. */
export function useSharedValue<T>(key: string, initial: T, opts: { enabled?: boolean } = {}) {
  let store = values.get(key) as SharedValue<T> | undefined;
  if (!store) {
    store = new SharedValue<T>(key, initial);
    values.set(key, store);
  }
  const value = useSyncExternalStore(store.subscribe, store.get, store.get);
  const enabled = opts.enabled !== false;
  useEffect(() => {
    if (enabled) store!.load();
  }, [store, enabled]);
  return [value, store.set] as const;
}

/* ------------------------------------------------------------------ */
/* Forms that save on a button                                         */
/* ------------------------------------------------------------------ */

const unsavedForms = new Set<symbol>();

/** Registers unsaved edits so leaving the page (or closing the tab) asks first. */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const token = Symbol('unsaved');
    unsavedForms.add(token);
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      unsavedForms.delete(token);
      window.removeEventListener('beforeunload', warn);
    };
  }, [dirty]);
}

/** True when nothing is unsaved, or the user agrees to drop their edits. */
export function confirmLeave() {
  return unsavedForms.size === 0 || window.confirm('You have unsaved changes. Leave without saving?');
}

/**
 * A local copy of a saved value for a form: edits stay here until the page saves them.
 * While nothing has been edited it follows the saved value (first load, another admin's
 * save). Changing `resetKey` (e.g. picking another student) starts again from the saved value.
 */
export function useDraft<T>(saved: T, resetKey?: unknown) {
  const savedJson = JSON.stringify(saved ?? null);
  const [state, setState] = useState({ base: savedJson, key: resetKey, value: saved });
  let value = state.value;
  if (state.key !== resetKey || (state.base !== savedJson && JSON.stringify(state.value ?? null) === state.base)) {
    value = saved;
    setState({ base: savedJson, key: resetKey, value: saved });
  } else if (state.base !== savedJson) {
    setState({ ...state, base: savedJson });
  }
  const dirty = JSON.stringify(value ?? null) !== savedJson;
  useUnsavedChanges(dirty);

  const setValue = useCallback((next: SetStateAction<T>) => {
    setState((s) => ({ ...s, value: typeof next === 'function' ? (next as (p: T) => T)(s.value) : next }));
  }, []);
  const reset = () => setValue(saved);
  return [value, setValue, { dirty, reset }] as const;
}

/* ------------------------------------------------------------------ */
/* Per-browser preferences (sidebar, last tab)                         */
/* ------------------------------------------------------------------ */

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

export function writeStore<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/**
 * useState that hydrates from localStorage after mount and writes back on change.
 * Hydrating after mount keeps server and client markup identical.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const hydrated = useRef(false);

  useEffect(() => {
    setValue(readStore(key, initial));
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (hydrated.current) writeStore(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

export const uid = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export const DAY_MS = 86_400_000;

export function formatDate(iso?: string, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(iso);
}

export function daysUntil(iso?: string) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / DAY_MS);
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Text starting with = + - @ (or a tab/return) runs as a formula when the file is opened in
 * Excel or Sheets, so a student could plant one in their name. Such cells get a leading
 * apostrophe (shown as plain text); parseCsv strips it again on import. Numbers are left alone.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

const escapeCell = (v: unknown) => {
  if (v === undefined || v === null) return '""';
  const s = typeof v === 'string' && FORMULA_START.test(v) ? `'${v}` : String(v);
  return `"${s.replace(/"/g, '""')}"`;
};

const unescapeCell = (s: string) => (s.length > 1 && s[0] === "'" && FORMULA_START.test(s.slice(1)) ? s.slice(1) : s);

export function toCsv(headers: string[], rows: unknown[][]) {
  return '﻿' + [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** RFC-4180 style parser: handles quoted cells, escaped quotes, CRLF and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== '')).map((r) => r.map(unescapeCell));
}

/** Parse CSV into objects keyed by normalised header (lowercase, non-alphanumerics → _). */
export function parseCsvObjects(text: string) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [] as Record<string, string>[];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = (r[i] ?? '').trim()));
    return o;
  });
}

export const pick = (o: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) if (o[k]) return o[k];
  return '';
};

export function readFileText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

/** Returns a function that opens a file picker for .csv and resolves with parsed objects. */
export function useCsvPicker(onRows: (rows: Record<string, string>[], fileName: string) => void) {
  return useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await readFileText(file);
      onRows(parseCsvObjects(text), file.name);
    };
    input.click();
  }, [onRows]);
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || '·';

export const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

/** plural(1, 'entry', 'entries') -> "1 entry"; plural(3, 'lesson') -> "3 lessons". */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
