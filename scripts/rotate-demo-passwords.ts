import './load-env';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

/**
 * Donne un nouveau mot de passe aléatoire aux comptes de démonstration (@example.fr) et ferme leurs sessions.
 * Usage : DATABASE_URL=… npm run db:rotate-demo   (le mot de passe est affiché une seule fois)
 */
async function main() {
  const { like, sql } = await import('drizzle-orm');
  const { db, client, schema } = await import('../src/db');
  const password = process.env.SEED_PASSWORD?.trim() || `Clic-${randomBytes(15).toString('base64url')}-9`;
  if (password.length < 12) throw new Error('SEED_PASSWORD doit contenir au moins 12 caractères.');

  const updated = await db
    .update(schema.users)
    .set({ passwordHash: await bcrypt.hash(password, 12), sessionVersion: sql`${schema.users.sessionVersion} + 1` })
    .where(like(schema.users.email, '%@example.fr'))
    .returning({ email: schema.users.email });
  client.close();
  console.log(`✔ ${updated.length} compte(s) de démonstration mis à jour.`);
  if (updated.length) console.log(`Nouveau mot de passe : ${password}`);
}

main().catch((error) => {
  console.error('✖ Échec :', error);
  process.exit(1);
});
