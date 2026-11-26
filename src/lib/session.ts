import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'proxitech_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET est manquant ou trop court (32 caractères minimum). Voir .env.example.');
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { userId: number; version: number };

/**
 * Crée un jeton signé et le dépose dans un cookie HttpOnly.
 * `version` reprend users.session_version : l'augmenter côté base invalide tous les jetons existants.
 */
export async function createSession(userId: number, version: number): Promise<void> {
  const token = await new SignJWT({ v: version })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Renvoie l'utilisateur et la version de session du jeton, ou null si la session est absente ou invalide. */
export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const userId = Number(payload.sub);
    const version = typeof payload.v === 'number' ? payload.v : 0;
    return Number.isInteger(userId) && userId > 0 ? { userId, version } : null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
