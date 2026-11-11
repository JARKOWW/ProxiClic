import { DURATIONS, DURATION_LABELS } from './constants';

/** Tous les horaires sont saisis et affichés à l'heure de Paris, quel que soit le serveur. */
export const TIME_ZONE = 'Europe/Paris';
const LOCALE = 'fr-FR';

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});
const dateFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });
const shortFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const relativeFmt = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

/** « jeudi 12 novembre à 14:00 » */
export const formatDateTime = (d: Date | string | number) => dateTimeFmt.format(new Date(d));
/** « 12 novembre 2026 » */
export const formatDate = (d: Date | string | number) => dateFmt.format(new Date(d));
/** « 14:00 » */
export const formatTime = (d: Date | string | number) => timeFmt.format(new Date(d));
/** « 12 nov., 14:00 » */
export const formatShort = (d: Date | string | number) => shortFmt.format(new Date(d));

/** « il y a 2 jours », « hier », « il y a 3 heures » */
export function formatRelative(d: Date, now = new Date()): string {
  const seconds = Math.round((d.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "à l'instant";
  if (abs < 3600) return relativeFmt.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relativeFmt.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 30) return relativeFmt.format(Math.round(seconds / 86400), 'day');
  return `le ${formatDate(d)}`;
}

export function formatDuration(minutes: number): string {
  return (DURATIONS as readonly number[]).includes(minutes)
    ? DURATION_LABELS[minutes as (typeof DURATIONS)[number]]
    : `${minutes} minutes`;
}

/** Convertit une date (AAAA-MM-JJ) et une heure (HH:MM) exprimées à l'heure de Paris en instant UTC. */
export function parisToDate(date: string, time: string): Date {
  const asUtc = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(asUtc);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const local = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return new Date(asUtc.getTime() - (local - asUtc.getTime()));
}

/** « Monique D. » — on n'affiche jamais le nom complet aux autres membres. */
export function displayName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName.charAt(0).toUpperCase()}.`;
}

export function excerpt(text: string, max = 160): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}
