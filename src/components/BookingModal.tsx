'use client';

import { useActionState, useMemo, useRef, useState } from 'react';
import { createBooking } from '@/actions/bookings';
import { DURATIONS, DURATION_LABELS, TIME_SLOTS } from '@/lib/constants';
import { SubmitButton } from './SubmitButton';
import { Notice } from './ui';

const DAYS_SHOWN = 14;

type Day = { value: string; weekday: string; day: string; month: string; full: string };

/** Les 14 prochains jours, à partir de demain. */
function upcomingDays(): Day[] {
  const pad = (n: number) => String(n).padStart(2, '0');
  return Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      value: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      weekday: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      day: String(d.getDate()),
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      full: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    };
  });
}

type Props = { requestId: number; requestTitle: string; clientName: string; availability: string | null };

export function BookingModal({ requestId, requestTitle, clientName, availability }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [state, action] = useActionState(createBooking.bind(null, requestId), undefined);

  // Calculé à l'ouverture, côté navigateur uniquement (dépend de la date du jour).
  const days = useMemo(() => (open ? upcomingDays() : []), [open]);
  const selectedDay = days.find((d) => d.value === date);

  function show() {
    setOpen(true);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button type="button" className="btn btn-primary btn-lg" onClick={show}>
        <span aria-hidden="true">📅</span> Proposer un rendez-vous
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="rdv-titre"
        onClose={() => setOpen(false)}
        className="m-auto w-[min(100%-1.5rem,42rem)] rounded-2xl p-0 shadow-2xl"
      >
        {open && (
          <form action={action} className="flex max-h-[90vh] flex-col">
            <div className="border-line flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 id="rdv-titre" className="text-2xl">
                  Proposer un rendez-vous
                </h2>
                <p className="text-ink-soft mt-1">
                  {clientName} · {requestTitle}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-quiet shrink-0 px-4"
                onClick={() => dialogRef.current?.close()}
                aria-label="Fermer la fenêtre"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto p-5">
              {state?.error && <Notice tone="error">{state.error}</Notice>}
              {availability && (
                <Notice tone="info">
                  Disponibilités indiquées par {clientName} : <span className="font-normal">{availability}</span>
                </Notice>
              )}

              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="time" value={time} />

              <fieldset>
                <legend className="label">1. Choisissez un jour</legend>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {days.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      aria-pressed={date === d.value}
                      aria-label={d.full}
                      onClick={() => setDate(d.value)}
                      className={`flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-1 py-2 ${
                        date === d.value
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-line-strong hover:bg-brand-100 bg-white'
                      }`}
                    >
                      <span className="text-sm capitalize">{d.weekday}</span>
                      <span className="text-2xl leading-none font-bold">{d.day}</span>
                      <span className="text-sm">{d.month}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="label">2. Choisissez une heure</legend>
                <div className="space-y-3">
                  {Object.entries(TIME_SLOTS).map(([period, slots]) => (
                    <div key={period} className="flex flex-wrap items-center gap-2">
                      <span className="text-ink-soft w-24 text-sm font-bold">{period}</span>
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          aria-pressed={time === slot}
                          onClick={() => setTime(slot)}
                          className={`min-h-12 min-w-20 cursor-pointer rounded-xl border-2 px-3 font-bold ${
                            time === slot
                              ? 'border-brand-700 bg-brand-700 text-white'
                              : 'border-line-strong hover:bg-brand-100 bg-white'
                          }`}
                        >
                          {slot.replace(':', ' h ')}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="durationMin" className="label">
                  3. Durée estimée
                </label>
                <select id="durationMin" name="durationMin" className="input" defaultValue={state?.values?.durationMin ?? '60'}>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {DURATION_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="label">
                  4. Un mot pour {clientName} <span className="text-ink-soft font-normal">(facultatif)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  maxLength={1000}
                  className="input"
                  placeholder="Présentez-vous en quelques mots…"
                  defaultValue={state?.values?.message}
                />
              </div>
            </div>

            <div className="border-line bg-brand-50 flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className="font-bold">
                {selectedDay && time
                  ? `${selectedDay.full} à ${time.replace(':', ' h ')}`
                  : 'Sélectionnez un jour et une heure.'}
              </p>
              <SubmitButton pendingLabel="Envoi…">Envoyer ma proposition</SubmitButton>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
