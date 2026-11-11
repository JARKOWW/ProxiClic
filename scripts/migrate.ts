import './load-env';
import { migrate } from 'drizzle-orm/libsql/migrator';

async function main() {
  const { db, client } = await import('../src/db');
  await migrate(db, { migrationsFolder: './drizzle' });
  client.close();
  console.log('✔ Migrations appliquées.');
}

main().catch((error) => {
  console.error('✖ Échec des migrations :', error);
  process.exit(1);
});
