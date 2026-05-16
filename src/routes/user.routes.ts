// ─────────────────────────────────────────────────────────────────────────────
// src/routes/user.routes.ts
// User management routes (Admin only)
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { User } from '../models';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All user management routes require authentication + Admin role
router.use(protect, authorize('Admin'));

// ─── GET /api/users ───────────────────────────────────────────────────────────

/**
 * @route   GET /api/users
 * @desc    List all users (Admin only)
 * @access  Admin
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '20' } = req.query as {
      page?: string;
      limit?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(),
    ]);

    sendPaginated(res, 200, 'Users retrieved successfully.', users, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  }),
);

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user (Admin only)
 * @access  Admin
 */
router.get(
  '/:id',
  catchAsync(async (req: Request, res: Response, next): Promise<void> => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError(`User not found with ID: ${req.params.id}`, 404));
    }
    sendSuccess(res, 200, 'User retrieved successfully.', user);
  }),
);

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user account (Admin only)
 * @access  Admin
 */
router.delete(
  '/:id',
  catchAsync(async (req: Request, res: Response, next): Promise<void> => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return next(new AppError(`User not found with ID: ${req.params.id}`, 404));
    }
    sendSuccess(res, 200, 'User deleted successfully.', null);
  }),
);

export default router;
