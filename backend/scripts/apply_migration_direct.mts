// apply_migration_direct.mjs — run the SQL migration directly against DATABASE_URL
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs/promises';
import path from 'path';

// Read DATABASE_URL from environment (dotenv loads backend/.env when using -r dotenv/config)
if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Set it in backend/.env or export it in your shell.'
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function applyMigration() {
  try {
    const migrationPath = path.resolve(
      process.cwd(),
      'src',
      'db',
      'migrations',
      '0000_narrow_ender_wiggin.sql'
    );
    const content = await fs.readFile(migrationPath, 'utf8');

    console.log('Applying SQL migration:', migrationPath);

    // Try to run the whole content via sql.query if available
    if (typeof sql.query === 'function') {
      try {
        await sql.query(content);
        console.log('Migration applied successfully via sql.query.');
        return;
      } catch (e) {
        console.warn(
          'sql.query failed, will try splitting statements and running individually:',
          e && e.message ? e.message : e
        );
      }
    }

    // Fallback: split into statements and run each one with sql.query
    const statements = content
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        console.log('Executing statement...');
        if (typeof sql.query === 'function') {
          await sql.query(stmt);
        } else if (typeof sql === 'function') {
          // some clients expose a template-tag function; cast to any to avoid TS template types
          await (sql as any)(stmt);
        } else {
          throw new Error('No known query method on neon client');
        }
      } catch (innerErr) {
        console.error('Failed executing statement:', innerErr);
        throw innerErr;
      }
    }

    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Failed to apply migration:', err);
    process.exit(2);
  }
}

applyMigration();
