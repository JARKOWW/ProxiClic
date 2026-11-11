// Importé en premier par chaque script : charge .env avant l'ouverture de la base.
import { mkdirSync } from 'node:fs';

try {
  process.loadEnvFile();
} catch {
  // Pas de fichier .env : on s'appuie sur les variables d'environnement existantes.
}

process.env.DATABASE_URL ??= 'file:./data/proxitech.db';
mkdirSync('data', { recursive: true });
