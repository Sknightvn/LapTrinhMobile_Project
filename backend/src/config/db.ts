import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { ENV } from './env.js';
import * as schema from '../db/schema.js';
import dotenv from 'dotenv';
dotenv.config(); // phải chạy trước


if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Check your .env file.');
}

export const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
