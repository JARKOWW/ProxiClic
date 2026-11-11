import { z } from 'zod';
import { CATEGORY_KEYS, DURATIONS, ROLES } from './constants';

/** État renvoyé par les actions serveur aux formulaires. */
export type FormState =
  | {
      error?: string;
      success?: string;
      fieldErrors?: Record<string, string[] | undefined>;
      values?: Record<string, string>;
    }
  | undefined;

/** Extrait les champs texte d'un FormData (les fichiers sont ignorés). */
export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.startsWith('$ACTION')) out[key] = value;
  }
  return out;
}

export const fieldErrors = (error: z.ZodError) =>
  z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;

const requiredText = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} est obligatoire.` })
    .trim()
    .min(min, min <= 1 ? `${label} est obligatoire.` : `${label} doit contenir au moins ${min} caractères.`)
    .max(max, `${label} ne doit pas dépasser ${max} caractères.`);

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} ne doit pas dépasser ${max} caractères.`)
    .optional()
    .transform((v) => (v ? v : null));

const email = z
  .string({ error: "L'adresse e-mail est obligatoire." })
  .trim()
  .toLowerCase()
  .max(254, "L'adresse e-mail est trop longue.")
  .pipe(z.email('Veuillez saisir une adresse e-mail valide, par exemple nom@exemple.fr.'));

const password = z
  .string({ error: 'Le mot de passe est obligatoire.' })
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .max(72, 'Le mot de passe ne doit pas dépasser 72 caractères.')
  .regex(/[A-Za-zÀ-ÿ]/, 'Le mot de passe doit contenir au moins une lettre.')
  .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre.');

const location = {
  neighborhood: requiredText('Le quartier', 2, 80),
  city: requiredText('La ville', 2, 80),
  postalCode: z
    .string({ error: 'Le code postal est obligatoire.' })
    .trim()
    .regex(/^\d{5}$/, 'Le code postal doit comporter 5 chiffres, par exemple 69004.'),
};

const identity = {
  firstName: requiredText('Le prénom', 2, 60),
  lastName: requiredText('Le nom', 2, 60),
};

export const registerSchema = z.object({
  role: z.enum(ROLES, { error: 'Veuillez choisir un type de compte.' }),
  ...identity,
  email,
  password,
  ...location,
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Le mot de passe est obligatoire.' }).min(1, 'Le mot de passe est obligatoire.').max(72),
});

export const profileSchema = z.object({
  ...identity,
  ...location,
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^(?:\+33 ?|0)[1-9](?:[ .-]?\d{2}){4}$/.test(v), {
      error: 'Veuillez saisir un numéro de téléphone valide, par exemple 06 12 34 56 78.',
    }),
  bio: optionalText('La présentation', 500),
  skills: optionalText('Les compétences', 200),
});

export const requestSchema = z.object({
  title: requiredText('Le titre', 5, 100),
  category: z.enum(CATEGORY_KEYS, { error: 'Veuillez choisir une catégorie.' }),
  description: requiredText('La description', 20, 1500),
  availability: optionalText('Les disponibilités', 200),
});

export const bookingSchema = z.object({
  date: z.string({ error: 'Veuillez choisir un jour.' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Veuillez choisir un jour.'),
  time: z
    .string({ error: 'Veuillez choisir une heure.' })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Veuillez choisir une heure.'),
  durationMin: z.coerce
    .number()
    .refine((n) => (DURATIONS as readonly number[]).includes(n), { error: 'Veuillez choisir une durée.' }),
  message: optionalText('Le message', 1000),
});

export const messageSchema = z.object({
  body: requiredText('Le message', 1, 2000),
});

export const reviewSchema = z.object({
  rating: z.coerce
    .number({ error: 'Veuillez choisir une note.' })
    .int('Veuillez choisir une note.')
    .min(1, 'Veuillez choisir une note entre 1 et 5 étoiles.')
    .max(5, 'Veuillez choisir une note entre 1 et 5 étoiles.'),
  comment: optionalText('Le commentaire', 600),
});

export const idSchema = z.coerce.number().int().positive();
