import { TIME_ZONE } from './format';

/** À partir de cet âge, les demandeurs reçoivent l'affichage simplifié. */
export const SIMPLE_VIEW_MIN_AGE = 45;
export const MIN_AGE = 15;
/** Âge minimum des aidants, qui se rendent seuls au domicile de personnes souvent âgées. */
export const HELPER_MIN_AGE = 18;
export const MAX_AGE = 120;

/** Date du jour à l'heure de Paris, au format AAAA-MM-JJ. */
export function todayInParis(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now);
}

/** Âge en années révolues à une date donnée (par défaut aujourd'hui, heure de Paris). */
export function ageFrom(birthDate: string, today = todayInParis()): number {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

/** Affichage attribué selon l'âge : simplifié pour les demandeurs de 45 ans et plus. */
export const simpleViewForAge = (role: string, birthDate: string) =>
  role === 'client' && ageFrom(birthDate) >= SIMPLE_VIEW_MIN_AGE;
