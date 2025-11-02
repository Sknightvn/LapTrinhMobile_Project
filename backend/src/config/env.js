// JS shim for runtime imports when running under Node ESM
// This keeps runtime resolution simple while TypeScript sources remain the single source of truth.
export const ENV = {
  PORT: process.env.PORT || 5001,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
};
