import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL est manquant. Copiez .env.example vers .env et renseignez-le.");
}

// En développement, on réutilise la même connexion entre deux rechargements à chaud.
const globalForDb = globalThis as unknown as { __proxiclicClient?: Client };
export const client = globalForDb.__proxiclicClient ?? createClient({ url });
if (process.env.NODE_ENV !== 'production') globalForDb.__proxiclicClient = client;

export const db = drizzle(client, { schema });
export { schema };
