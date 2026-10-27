import React, { useEffect, useState } from 'react';
import type { Appointment } from '../../types/counselor';
import { Button, Field, Input, Modal, cx } from '../admin/ui';
import { FormError, fmtDay, fmtTime, isoOf, to24h, todayIso, useAsyncAction } from './kit';
import { useCareerStore } from '../../hooks/useCareerStore';
import { BookedSlot, SlotOwner, bookedAt, localDate, nextOpenDays, unavailableReason } from '../../lib/slots';

/**
 * Moves an upcoming 1-on-1 session. Students pick one of their mentor's or counsellor's open
 * days and slots; the mentor or counsellor (`anyTime`) can also type another time. Times
 * someone else already has are shown as booked. The other side is notified by the server.
 */
export const RescheduleModal: React.FC<{
  appointment: Appointment | null;
  /** The counsellor or mentor running the session (their open days and slots). */
  provider: SlotOwner | null;
  anyTime?: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}> = ({ appointment, provider, anyTime, onClose, onDone }) => {
  const { rescheduleAppointment, bookedSlots } = useCareerStore();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [booked, setBooked] = useState<BookedSlot[]>([]);
  const { busy, error, setError, run } = useAsyncAction();
  const owner: SlotOwner = provider || { name: appointment?.counselorName || '' };
  const slots = owner.availableTimeSlots || [];

  useEffect(() => {
    if (!appointment) return;
    setDate(isoOf(appointment.date) >= todayIso() ? isoOf(appointment.date) : nextOpenDays(owner, 1)[0] || todayIso());
    setTime('');
    setError(null);
    setBooked([]);
    let live = true;
    bookedSlots(appointment.counselorId)
      .then((list) => live && setBooked(list))
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id]);

  if (!appointment) return null;
  const isCurrent = (t: string) => date === isoOf(appointment.date) && to24h(t) === to24h(appointment.time);
  const dayProblem = date ? (anyTime ? (date < todayIso() ? 'Choose a date from today onwards.' : null) : unavailableReason(owner, date)) : 'Choose a new date.';

  const save = async () => {
    if (dayProblem) return setError(dayProblem);
    if (!time) return setError('Choose a new time.');
    if (isCurrent(time)) return setError('That is already the session time.');
    const taken = bookedAt(booked, date, time);
    if (taken && !isCurrent(time)) return setError('That time is already booked. Please pick another slot.');
    if (await run(() => rescheduleAppointment(appointment.id, date, time))) {
      const who = anyTime ? appointment.studentName : appointment.counselorName;
      onDone(`Session moved to ${fmtDay(date)} at ${time}. ${who} has been notified.`);
      onClose();
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Reschedule session"
      description={`${appointment.topic || appointment.counselingType} with ${anyTime ? appointment.studentName : appointment.counselorName} · now ${fmtDay(appointment.date)} at ${appointment.time}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy || !date || !time}>
            {busy ? 'Saving…' : 'Reschedule & notify'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="New date" hint={!anyTime && owner.availabilityDays?.length ? `${owner.name.split(' ')[0]} takes sessions on ${owner.availabilityDays.join(', ')}.` : undefined}>
          <Input
            type="date"
            min={todayIso()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime('');
            }}
          />
          {!anyTime && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {nextOpenDays(owner).map((iso) => (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setDate(iso);
                    setTime('');
                  }}
                  className={cx('px-2 py-1 rounded-[8px] text-[12px] font-semibold border', date === iso ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'bg-white border-[#D3DBE8] text-[#26355A] hover:bg-[#F3F6FB]')}
                >
                  {localDate(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </button>
              ))}
            </div>
          )}
        </Field>
        {date && dayProblem && <p className="text-[12.5px] font-medium text-[#94570A]">{dayProblem}</p>}

        {!dayProblem && (
          <Field label="New time">
            {slots.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const current = isCurrent(slot);
                  const taken = !current && bookedAt(booked, date, slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={current || !!taken}
                      onClick={() => setTime(slot)}
                      className={cx(
                        'h-9 px-3 rounded-[10px] text-[13px] font-semibold border',
                        current || taken ? 'bg-[#F3F6FB] border-[#E2E8F2] text-[#9AA5BB] cursor-not-allowed' : time === slot ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'bg-white border-[#D3DBE8] text-[#26355A] hover:bg-[#F3F6FB]'
                      )}
                    >
                      <span className={taken ? 'line-through' : undefined}>{slot}</span>
                      {current && <span className="ml-1.5 text-[11.5px]">Current</span>}
                      {taken && <span className="ml-1.5 text-[11.5px]">{taken.mine ? 'Yours' : 'Booked'}</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              !anyTime && <p className="text-[13px] text-[#5B6885]">{owner.name || 'They'} hasn't listed time slots yet. Message them to agree a time.</p>
            )}
            {anyTime && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[12.5px] text-[#5B6885]">{slots.length ? 'Or another time' : 'Time'}</span>
                <Input type="time" className="w-36" value={time && !slots.includes(time) ? to24h(time) : ''} onChange={(e) => setTime(e.target.value ? fmtTime(e.target.value) : '')} />
              </div>
            )}
          </Field>
        )}
        <FormError message={error} />
      </div>
    </Modal>
  );
};
