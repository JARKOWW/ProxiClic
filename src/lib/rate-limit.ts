import { lt, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db } from '@/db';
import { rateLimits } from '@/db/schema';

/**
 * Limiteur de tentatives à fenêtre fixe, stocké dans la base : il fonctionne aussi quand le site tourne
 * sur plusieurs instances (Vercel) et survit aux redémarrages.
 * L'incrément est atomique (une seule requête INSERT … ON CONFLICT … RETURNING).
 */
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterMin: number }> {
  const now = Date.now();
  const resetAt = now + windowMs;

  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= ${now} then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= ${now} then ${resetAt} else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  // Ménage occasionnel des compteurs expirés (environ une requête sur 50).
  if (Math.random() < 0.02) await db.delete(rateLimits).where(lt(rateLimits.resetAt, now));

  if (row.count > max) {
    return { allowed: false, retryAfterMin: Math.max(1, Math.ceil((row.resetAt - now) / 60_000)) };
  }
  return { allowed: true, retryAfterMin: 0 };
}

export async function resetRateLimit(key: string): Promise<void> {
  await db.delete(rateLimits).where(sql`${rateLimits.key} = ${key}`);
}

/**
 * Adresse IP du visiteur.
 * Sur Vercel, X-Forwarded-For est réécrit par la plateforme. Derrière nginx (VPS), le proxy doit écraser
 * l'en-tête (`proxy_set_header X-Forwarded-For $remote_addr;`, voir DEPLOIEMENT.md), sinon un visiteur
 * pourrait le falsifier pour contourner la limitation.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-real-ip')?.trim() || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'inconnue';
}
