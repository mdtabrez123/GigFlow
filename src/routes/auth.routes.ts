// ─────────────────────────────────────────────────────────────────────────────
// src/routes/auth.routes.ts
// Authentication routes — thin router, delegates to auth.controller.ts
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// ── Public routes (no token required) ────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password, role? }
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', login);

// ── Protected routes (JWT required) ──────────────────────────────────────────

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
router.get('/me', protect, getMe);

/**
 * PATCH /api/auth/change-password
 * Body: { currentPassword, newPassword }
 */
router.patch('/change-password', protect, changePassword);

export default router;
