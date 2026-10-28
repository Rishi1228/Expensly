import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { getMe } from './controllers/me.js';
import expensesRouter from './routes/expenses.js';
import { categoriesRouter, subcategoriesRouter } from './routes/categories.js';
import statsRouter from './routes/stats.js';
import recurringRouter from './routes/recurring.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',') }));
  app.use(express.json({ limit: '100kb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  // Public
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Everything below needs a signed-in user
  const api = express.Router();
  api.use(requireAuth);
  api.get('/me', getMe);
  api.use('/expenses', expensesRouter);
  api.use('/categories', categoriesRouter);
  api.use('/subcategories', subcategoriesRouter);
  api.use('/stats', statsRouter);
  api.use('/recurring', recurringRouter);
  app.use('/api', api);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
