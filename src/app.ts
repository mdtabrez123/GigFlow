// ─────────────────────────────────────────────────────────────────────────────
// src/app.ts
// Express application factory — no server.listen() here so it's testable
// ─────────────────────────────────────────────────────────────────────────────

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';

// Routes
import authRoutes from './routes/auth.routes';
import leadRoutes from './routes/lead.routes';
import userRoutes from './routes/user.routes';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const createApp = (): Application => {
  const app = express();

  // ── Global Middleware ──────────────────────────────────────────────────────

  app.use(
    cors({
      origin: (origin, callback) => {
        // Always allow localhost in development, or fallback to ALLOWED_ORIGINS
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true);
        } else {
          const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
          if (allowed.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '10kb' }));         // Body parser (JSON)
  app.use(express.urlencoded({ extended: true }));  // Body parser (URL-encoded)

  // ── Health Check ───────────────────────────────────────────────────────────

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
    });
  });

  // ── API Routes ─────────────────────────────────────────────────────────────

  app.use('/api/auth', authRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/users', userRoutes);

  // ── Root welcome route ─────────────────────────────────────────────────────
  // Shown when someone opens http://localhost:5000 in the browser.
  // The actual UI lives at http://localhost:5173 (Vite dev server).

  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: '🚀 GigFlow Lead Management API is running.',
      version: '1.0.0',
      frontend: 'http://localhost:5173',
      endpoints: {
        health:   'GET  /health',
        register: 'POST /api/auth/register',
        login:    'POST /api/auth/login',
        me:       'GET  /api/auth/me',
        leads:    'GET  /api/leads',
        users:    'GET  /api/users',
      },
    });
  });

  // ── Silence browser favicon requests ──────────────────────────────────────
  app.get('/favicon.ico', (_req: Request, res: Response) => res.sendStatus(204));

  // ── 404 & Error Handlers (must be last) ───────────────────────────────────

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
