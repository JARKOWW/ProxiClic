export const APP_NAME = "Proxi'Clic";
export const APP_TAGLINE = "L'informatique à domicile";

export const ROLES = ['client', 'helper'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  client: "J'ai besoin d'aide",
  helper: 'Je propose mon aide',
};

export const ROLE_NAMES: Record<Role, string> = {
  client: 'Demandeur',
  helper: 'Aidant',
};

export const CATEGORY_KEYS = [
  'imprimante',
  'wifi',
  'smartphone',
  'ordinateur',
  'tablette',
  'email',
  'tv',
  'securite',
  'demarches',
  'autre',
] as const;
export type Category = (typeof CATEGORY_KEYS)[number];

export const CATEGORIES: Record<Category, { label: string; icon: string }> = {
  imprimante: { label: 'Imprimante', icon: '🖨️' },
  wifi: { label: 'Wi-Fi et Internet', icon: '📶' },
  smartphone: { label: 'Smartphone', icon: '📱' },
  ordinateur: { label: 'Ordinateur', icon: '💻' },
  tablette: { label: 'Tablette', icon: '📲' },
  email: { label: 'E-mails', icon: '✉️' },
  tv: { label: 'Télévision et box', icon: '📺' },
  securite: { label: 'Sécurité et arnaques', icon: '🔒' },
  demarches: { label: 'Démarches en ligne', icon: '🗂️' },
  autre: { label: 'Autre', icon: '💡' },
};

export const REQUEST_STATUSES = ['open', 'booked', 'done', 'cancelled'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'En attente d’un aidant',
  booked: 'Rendez-vous fixé',
  done: 'Terminée',
  cancelled: 'Annulée',
};

export const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'declined', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'En attente de réponse',
  confirmed: 'Confirmé',
  completed: 'Effectué',
  declined: 'Refusé',
  cancelled: 'Annulé',
};

export const DURATIONS = [30, 60, 90, 120] as const;

export const DURATION_LABELS: Record<(typeof DURATIONS)[number], string> = {
  30: '30 minutes',
  60: '1 heure',
  90: '1 h 30',
  120: '2 heures',
};

/** Créneaux proposés dans le sélecteur de rendez-vous. */
export const TIME_SLOTS = {
  Matin: ['09:00', '10:00', '11:00', '12:00'],
  'Après-midi': ['14:00', '15:00', '16:00', '17:00'],
  Soir: ['18:00', '19:00'],
} as const;

/** Compliments à cocher dans un avis : plus rapide à remplir qu'un long commentaire. */
export const REVIEW_TAG_KEYS = ['patient', 'pedagogue', 'ponctuel', 'efficace', 'souriant', 'soigneux'] as const;
export type ReviewTag = (typeof REVIEW_TAG_KEYS)[number];

export const REVIEW_TAGS: Record<ReviewTag, { label: string; icon: string }> = {
  patient: { label: 'Patient', icon: '🧘' },
  pedagogue: { label: 'Explications claires', icon: '🎓' },
  ponctuel: { label: 'Ponctuel', icon: '⏰' },
  efficace: { label: 'Efficace', icon: '⚡' },
  souriant: { label: 'Souriant', icon: '😊' },
  soigneux: { label: 'Soigneux', icon: '🧹' },
};

/** Photos jointes à un avis. Elles sont réduites dans le navigateur avant l'envoi. */
export const REVIEW_PHOTO_MAX_COUNT = 3;
export const REVIEW_PHOTO_MAX_BYTES = 900_000;
/** Plus grand côté, en pixels, après réduction dans le navigateur. */
export const REVIEW_PHOTO_MAX_SIDE = 1600;
