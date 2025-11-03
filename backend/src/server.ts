import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { db } from './config/db.js';
import { favoritesTable } from './db/schema.js';
import { and, eq } from 'drizzle-orm';
import job from './config/cron.js';

const app = express();
// Allow CORS from the frontend dev origin. Adjust or expand the origin list for production.
const corsOptions = {
  origin: function (origin, callback) {

    if (!origin) return callback(null, true);
    
    if (ENV.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(null, true);
  },
  credentials: true
};
app.use(cors(corsOptions));
// Respond to preflight requests for all routes with a lightweight handler
// Avoid using a path pattern that triggers path-to-regexp parsing issues.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.sendStatus(204);
  }
  next();
});

// Simple request logger to help debug CORS/preflight issues
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.path);
  next();
});
const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === 'production') job.start();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true });
});

app.post('/api/favorites', async (req, res) => {
  try {
    const { userId, recipeId, title, image, cookTime, servings } = req.body;

    if (!userId || !recipeId || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newFavorite = await db
      .insert(favoritesTable)
      .values({
        userId,
        recipeId,
        title,
        image,
        cookTime,
        servings,
      })
      .returning();

    res.status(201).json(newFavorite[0]);
  } catch (error) {
    console.log('Error adding favorite', error);
    res.status(500).json({ error: 'Something went wrong', details: error.message });
  }
});

app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userFavorites = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));

    res.status(200).json(userFavorites);
  } catch (error) {
    console.log('Error fetching the favorites', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.delete('/api/favorites/:userId/:recipeId', async (req, res) => {
  try {
    const { userId, recipeId } = req.params;

    await db
      .delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, userId),
          eq(favoritesTable.recipeId, parseInt(recipeId))
        )
      );

    res.status(200).json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.log('Error removing a favorite', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Local: http://localhost:${PORT}`);
  console.log(`📱 Network: http://${ENV.HOST}:${PORT}`);
});
