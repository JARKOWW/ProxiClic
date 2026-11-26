'use server';

import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { deleteAccountData } from '@/lib/account';
import { hashPassword, requireUser, verifyPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createSession, destroySession } from '@/lib/session';
import { changePasswordSchema, fieldErrors, type FormState } from '@/lib/validation';

async function checkPassword(userId: number, password: string): Promise<boolean> {
  const row = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { passwordHash: true } });
  return !!row && (await verifyPassword(password, row.passwordHash));
}

/** Changement de mot de passe : les sessions ouvertes sur les autres appareils sont fermées. */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const input = {
    currentPassword: formData.get('currentPassword') ?? '',
    newPassword: formData.get('newPassword') ?? '',
    confirmPassword: formData.get('confirmPassword') ?? '',
  };
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: 'Certains champs sont à corriger.', fieldErrors: fieldErrors(parsed.error) };

  const limit = await rateLimit(`password:${user.id}`, 5, 15 * 60_000);
  if (!limit.allowed) return { error: `Trop de tentatives. Veuillez réessayer dans ${limit.retryAfterMin} minutes.` };

  if (!(await checkPassword(user.id, parsed.data.currentPassword))) {
    return { error: 'Certains champs sont à corriger.', fieldErrors: { currentPassword: ['Ce mot de passe est incorrect.'] } };
  }

  const [updated] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.newPassword), sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, user.id))
    .returning({ sessionVersion: users.sessionVersion });
  // Nouvelle session sur cet appareil ; les autres sont déconnectés.
  await createSession(user.id, updated.sessionVersion);
  return { success: 'Votre mot de passe a bien été changé. Vos autres appareils ont été déconnectés.' };
}

/** Suppression définitive du compte, après confirmation par le mot de passe. */
export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const password = formData.get('password');
  if (typeof password !== 'string' || !password) {
    return { error: 'Indiquez votre mot de passe pour confirmer.', fieldErrors: { password: ['Indiquez votre mot de passe pour confirmer.'] } };
  }

  const limit = await rateLimit(`delete:${user.id}`, 5, 15 * 60_000);
  if (!limit.allowed) return { error: `Trop de tentatives. Veuillez réessayer dans ${limit.retryAfterMin} minutes.` };

  if (!(await checkPassword(user.id, password))) {
    return { error: 'Le mot de passe est incorrect.', fieldErrors: { password: ['Ce mot de passe est incorrect.'] } };
  }

  await deleteAccountData(user.id, user.email);
  await destroySession();
  redirect('/?ok=compte-supprime');
}
