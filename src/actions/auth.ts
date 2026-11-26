'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, homeFor, verifyPassword } from '@/lib/auth';
import { clientIp, rateLimit, resetRateLimit } from '@/lib/rate-limit';
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

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const { password: _password, ...values } = formValues(formData);
  const parsed = registerSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return { error: 'Certains champs sont à corriger.', fieldErrors: fieldErrorsWithBirthDate(parsed.error, values), values };
  }

  const limit = await rateLimit(`register:${await clientIp()}`, 10, 60 * 60_000);
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

  const now = new Date();
  const [created] = await db
    .insert(users)
    .values({ ...data, passwordHash: await hashPassword(password), termsAcceptedAt: now, lastLoginAt: now })
    .returning({ id: users.id, sessionVersion: users.sessionVersion });

  await createSession(created.id, created.sessionVersion);
  redirect(`${homeFor(data)}?ok=bienvenue`);
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const { password: _password, ...values } = formValues(formData);
  const parsed = loginSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return { error: 'Certains champs sont à corriger.', fieldErrors: fieldErrors(parsed.error), values };
  }

  const { email, password } = parsed.data;
  // Deux compteurs : 5 essais par adresse e-mail et par IP, et 20 par adresse e-mail toutes IP confondues
  // (contre une attaque répartie sur plusieurs adresses IP).
  const limitKey = `login:${email}:${await clientIp()}`;
  const [perIp, perAccount] = await Promise.all([
    rateLimit(limitKey, 5, 15 * 60_000),
    rateLimit(`login-account:${email}`, 20, 60 * 60_000),
  ]);
  const blocked = !perIp.allowed ? perIp : !perAccount.allowed ? perAccount : null;
  if (blocked) {
    return {
      error: `Trop de tentatives de connexion. Veuillez réessayer dans ${blocked.retryAfterMin} minutes.`,
      values,
    };
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    // Message volontairement identique dans les deux cas, pour ne pas révéler quels e-mails sont inscrits.
    return { error: 'Adresse e-mail ou mot de passe incorrect.', values };
  }

  await resetRateLimit(limitKey);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id, user.sessionVersion);
  redirect(homeFor(user));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect('/');
}
