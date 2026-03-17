import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import postgres from 'postgres';

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = postgres(url, { prepare: false });

  // Create _migrations table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  // Read applied migrations
  const appliedRows = await sql<{ name: string }[]>`
    SELECT name FROM _migrations ORDER BY name
  `;
  const applied = new Set(appliedRows.map((r) => r.name));

  // Read migration files
  const migrationsDir = join(process.cwd(), 'migrations');
  let files: string[] = [];

  try {
    const entries = await readdir(migrationsDir);
    files = entries.filter((f) => f.endsWith('.sql')).sort();
  } catch {
    console.log('No migrations directory found, skipping.');
    await sql.end();
    return;
  }

  const pending = files.filter((f) => !applied.has(f));

  if (!pending.length) {
    console.log('No pending migrations.');
    await sql.end();
    return;
  }

  for (const file of pending) {
    const filePath = join(migrationsDir, file);
    const content = await readFile(filePath, 'utf-8');

    console.log(`Applying migration: ${file}`);

    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx.unsafe(
        `INSERT INTO _migrations (name) VALUES ('${file.replace(/'/g, "''")}')`,
      );
    });

    console.log(`Applied: ${file}`);
  }

  console.log(`Done. Applied ${pending.length} migration(s).`);
  await sql.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
