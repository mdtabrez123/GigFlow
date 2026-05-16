// ─────────────────────────────────────────────────────────────────────────────
// src/routes/lead.routes.ts
// Lead CRUD routes — thin router, delegates to lead.controller.ts
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from '../controllers/lead.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All lead routes require a valid JWT
router.use(protect);

// ─── Collection routes (/api/leads) ──────────────────────────────────────────

router
  .route('/')
  /**
   * GET /api/leads
   * Query params: status, source, search, sort, page, limit
   * Admin sees all; Sales User sees own leads only (enforced in controller).
   */
  .get(getLeads)

  /**
   * POST /api/leads
   * Body: { name, email, source, status?, notes?, assignedTo? }
   */
  .post(createLead);

// ─── Document routes (/api/leads/:id) ────────────────────────────────────────

router
  .route('/:id')
  /**
   * GET /api/leads/:id
   * Admin can fetch any lead; Sales User can only fetch their own.
   */
  .get(getLeadById)

  /**
   * PATCH /api/leads/:id
   * Partial update. Sales User can only update their own leads.
   */
  .patch(updateLead)

  /**
   * DELETE /api/leads/:id
   * Admin only — authorize guard enforced here.
   */
  .delete(authorize('Admin'), deleteLead);

export default router;
