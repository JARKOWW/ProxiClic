'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, homeFor, verifyPassword } from '@/lib/auth';
import { rateLimit, resetRateLimit } from '@/lib/rate-limit';
import { createSession, destroySession } from '@/lib/session';
import {
  fieldErrors,
  fieldErrorsWithBirthDate,
  formValues,
  loginSchema,
  registerSchema,
  type FormState,
} from '@/lib/validation';

// Hash factice : permet de garder un temps de réponse constant quand l'e-mail est inconnu.
const DUMMY_HASH = '$2b$12$CwTycUXWue0Thq9StjUM0uJ8rG0pV0YvX4rU0mJ3p3mF0kT1x9yWm';

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const { password: _password, ...values } = formValues(formData);
  const parsed = registerSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return { error: 'Certains champs sont à corriger.', fieldErrors: fieldErrorsWithBirthDate(parsed.error, values), values };
  }

  const limit = rateLimit(`register:${await clientIp()}`, 10, 60 * 60_000);
  if (!limit.allowed) {
    return { error: `Trop de tentatives. Veuillez réessayer dans ${limit.retryAfterMin} minutes.`, values };
  }

  const { password, ...data } = parsed.data;
  const existing = await db.query.users.findFirst({ where: eq(users.email, data.email), columns: { id: true } });
  if (existing) {
    return {
      error: 'Certains champs sont à corriger.',
      fieldErrors: { email: ['Un compte existe déjà avec cette adresse e-mail. Essayez de vous connecter.'] },
      values,
    };
  }

  const [created] = await db
    .insert(users)
    .values({ ...data, passwordHash: await hashPassword(password) })
    .returning({ id: users.id });

  await createSession(created.id);
  redirect(`${homeFor(data)}?ok=bienvenue`);
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const { password: _password, ...values } = formValues(formData);
  const parsed = loginSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return { error: 'Certains champs sont à corriger.', fieldErrors: fieldErrors(parsed.error), values };
  }

  const { email, password } = parsed.data;
  const limitKey = `login:${email}:${await clientIp()}`;
  const limit = rateLimit(limitKey, 5, 15 * 60_000);
  if (!limit.allowed) {
    return {
      error: `Trop de tentatives de connexion. Veuillez réessayer dans ${limit.retryAfterMin} minutes.`,
      values,
    };
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    // Message volontairement identique dans les deux cas, pour ne pas révéler quels e-mails sont inscrits.
    return { error: 'Adresse e-mail ou mot de passe incorrect.', values };
  }

  resetRateLimit(limitKey);
  await createSession(user.id);
  redirect(homeFor(user));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect('/');
}
