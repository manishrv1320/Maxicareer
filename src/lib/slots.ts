import { to24h } from '../components/workspace/kit';

/**
 * Bookable days and times for a counsellor or mentor, shared by booking and rescheduling.
 * Dates are ISO days ("2026-09-22"); times are the provider's slot labels ("10:00 AM").
 */

export interface SlotOwner {
  name: string;
  availabilityDays?: string[];
  availableTimeSlots?: string[];
  blockedDates?: string[];
}

/** A time already taken with this person (no names). `mine` marks the viewer's own booking. */
export interface BookedSlot {
  date: string;
  time: string;
  mine: boolean;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number) => String(n).padStart(2, '0');

export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const localDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** "2026-09-22" -> "September 22, 2026", the format sessions are stored in. */
export const longDay = (iso: string) => localDate(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/** Why a day can't be booked with this person, or null when it can. */
export function unavailableReason(c: SlotOwner, iso: string) {
  if (!iso) return 'Please choose a preferred date for the session.';
  if (iso < isoDay(new Date())) return 'Please choose a date from today onwards.';
  if (c.blockedDates?.includes(iso)) return `${c.name.split(' ')[0]} is away on that day. Please pick another date.`;
  const day = WEEKDAYS[localDate(iso).getDay()];
  if (c.availabilityDays?.length && !c.availabilityDays.includes(day)) return `${c.name.split(' ')[0]} takes sessions on ${c.availabilityDays.join(', ')}.`;
  return null;
}

/** The next few days this person takes sessions. */
export function nextOpenDays(c: SlotOwner, count = 6) {
  const out: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  for (let i = 0; i < 60 && out.length < count; i++, d.setDate(d.getDate() + 1)) {
    const iso = isoDay(d);
    if (!unavailableReason(c, iso)) out.push(iso);
  }
  return out;
}

/** The booking of `time` on `iso`, if someone already has it ("4:00 PM" matches "04:00 PM"). */
export const bookedAt = (booked: BookedSlot[], iso: string, time: string) => booked.find((b) => b.date === iso && to24h(b.time) === to24h(time));
