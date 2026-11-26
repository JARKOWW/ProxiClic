import { defineConfig } from 'drizzle-kit';

try {
  process.loadEnvFile();
} catch {
  // Pas de fichier .env : on s'appuie sur les variables d'environnement existantes.
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'file:./data/proxiclic.db' },
});
