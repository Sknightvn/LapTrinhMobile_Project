import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

try {
  const res =
    await sql`select tablename from pg_catalog.pg_tables where schemaname='public'`;
  console.log('tables:', res);
} catch (err) {
  console.error('query error', err);
  process.exit(2);
}
