import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from './pool';

async function runMigrations(): Promise<void> {
  const dir = join(__dirname, 'migrations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8');
    console.log(`> Applico migrazione: ${file}`);
    await pool.query(sql);
  }

  console.log('Migrazioni completate.');
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Errore durante le migrazioni:', err);
  process.exit(1);
});
