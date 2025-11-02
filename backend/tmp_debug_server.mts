import express from 'express';
import cors from 'cors';
import { ENV } from './src/config/env.js';
import { db } from './src/config/db.js';
import { favoritesTable } from './src/db/schema.js';
import job from './src/config/cron.js';

console.log('imports OK');

const app = express();
console.log('express created');

const corsOptions = {
  origin: [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:19000',
  ],
};

try {
  app.use(cors(corsOptions));
  console.log('cors middleware registered');
} catch (e) {
  console.error('error registering cors', e);
}

try {
  app.options('*', cors(corsOptions));
  console.log('options registered');
} catch (e) {
  console.error('error registering options', e);
}

try {
  app.use((req, res, next) => {
    console.log('logger middleware');
    next();
  });
  console.log('logger registered');
} catch (e) {
  console.error('error registering logger', e);
}

try {
  app.use(express.json());
  console.log('json middleware registered');
} catch (e) {
  console.error('error registering json', e);
}

try {
  app.get('/api/health', (req, res) => res.status(200).json({ success: true }));
  console.log('route /api/health registered');
} catch (e) {
  console.error('error registering /api/health', e);
}

try {
  app.post('/api/favorites', async (req, res) => res.status(201).json({}));
  console.log('route POST /api/favorites registered');
} catch (e) {
  console.error('error registering POST /api/favorites', e);
}

try {
  app.get('/api/favorites/:userId', async (req, res) =>
    res.status(200).json([])
  );
  console.log('route GET /api/favorites/:userId registered');
} catch (e) {
  console.error('error registering GET /api/favorites/:userId', e);
}

try {
  app.delete('/api/favorites/:userId/:recipeId', async (req, res) =>
    res.status(200).json({})
  );
  console.log('route DELETE /api/favorites/:userId/:recipeId registered');
} catch (e) {
  console.error('error registering DELETE /api/favorites/:userId/:recipeId', e);
}

console.log('done registering');
