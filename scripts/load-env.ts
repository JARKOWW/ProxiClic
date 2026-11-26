// Importé en premier par chaque script : charge .env avant l'ouverture de la base.
import { existsSync, mkdirSync } from 'node:fs';

try {
  process.loadEnvFile();
} catch {
  // Pas de fichier .env : on s'appuie sur les variables d'environnement existantes.
}

// Ancien nom du fichier (Proxi'Tech) : on le réutilise s'il existe encore, pour ne pas perdre les données.
const legacyDb = existsSync('data/proxitech.db') && !existsSync('data/proxiclic.db');
process.env.DATABASE_URL ??= legacyDb ? 'file:./data/proxitech.db' : 'file:./data/proxiclic.db';
mkdirSync('data', { recursive: true });
