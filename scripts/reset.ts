import './load-env';
import { rmSync } from 'node:fs';

// Supprime le fichier SQLite local (et ses journaux). Sans effet sur une base distante.
const url = process.env.DATABASE_URL!;
if (!url.startsWith('file:')) {
  console.error('✖ db:reset ne fonctionne que pour une base locale (DATABASE_URL en file:...).');
  process.exit(1);
}

const path = url.slice('file:'.length);
for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(path + suffix, { force: true });
console.log(`✔ Base supprimée : ${path}`);
