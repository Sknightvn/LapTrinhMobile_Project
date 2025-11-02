import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

try {
  const res =
    await sql`select recipe_id, image, created_at from favorites order by created_at desc limit 10`;
  console.log('latest favorites (recipe_id, image, created_at):');
  console.table(res);
} catch (err) {
  console.error('query error', err);
  process.exit(2);
}
