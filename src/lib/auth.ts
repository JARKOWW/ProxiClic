import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/db';
import { users, type User } from '@/db/schema';
import type { Role } from './constants';
import { readSession } from './session';

const BCRYPT_COST = 12;

export type SessionUser = Omit<User, 'passwordHash'>;

export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Utilisateur connecté (sans le hash du mot de passe), mémorisé le temps d'une requête. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const id = await readSession();
  if (!id) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, id), columns: { passwordHash: false } });
  return user ?? null;
});

/** À utiliser dans les pages et actions protégées : redirige vers la connexion si besoin. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/connexion');
  return user;
}

export const homeFor = (role: Role) => (role === 'helper' ? '/demandes' : '/mes-demandes');
