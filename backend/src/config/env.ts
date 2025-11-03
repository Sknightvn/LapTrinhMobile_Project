import 'dotenv/config';

export const ENV = {
  PORT: process.env.PORT || 5001,
  HOST: process.env.HOST || '0.0.0.0',
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
};
