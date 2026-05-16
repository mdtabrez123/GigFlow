// ─────────────────────────────────────────────────────────────────────────────
// src/middleware/auth.middleware.ts
// JWT authentication + role-based authorization middleware
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { JwtPayload, UserRole } from '../types';

// ─── Global Request Augmentation ─────────────────────────────────────────────
//
// We extend Express's Request interface once here so every route file
// (and the controllers) can access `req.user` with full type-safety.

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        /** The raw, verified JWT payload — available for advanced uses */
        tokenPayload?: JwtPayload;
      };
    }
  }
}

// ─── Token Extraction Helper ──────────────────────────────────────────────────

/**
 * Extracts a Bearer token from the Authorization header.
 * Returns `null` if the header is absent or malformed.
 *
 * Accepted format:  Authorization: Bearer <token>
 */
const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim(); // 'Bearer '.length === 7
  }
  return null;
};

// ─── protect ─────────────────────────────────────────────────────────────────

/**
 * Authentication middleware — must run BEFORE any route handler that
 * requires the user to be logged in.
 *
 * Pipeline:
 *   1. Extract the Bearer token from the Authorization header.
 *   2. Verify the token signature and expiry using JWT_SECRET.
 *   3. Confirm the user encoded in the token still exists in MongoDB.
 *      (Catches the "deleted account but still has a valid token" edge case.)
 *   4. Attach `req.user = { id, role, tokenPayload }` for downstream use.
 *
 * Error responses:
 *   401 – Missing token, invalid signature, expired token, deleted user
 *   500 – JWT_SECRET not configured (server misconfiguration)
 */
export const protect = catchAsync(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // ── Step 1: Extract token ─────────────────────────────────────────────
    const token = extractBearerToken(req);

    if (!token) {
      return next(
        new AppError(
          'You are not logged in. Please provide a valid Bearer token.',
          401,
        ),
      );
    }

    // ── Step 2: Verify signature + expiry ─────────────────────────────────
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // This is a server misconfiguration, not a user error
      return next(new AppError('Server configuration error: JWT secret is missing.', 500));
    }

    // jwt.verify throws JsonWebTokenError (bad signature) or
    // TokenExpiredError (exp in the past) — both caught by errorHandler.ts
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // ── Step 3: Confirm user still exists ────────────────────────────────
    // We select only the `role` field to keep this DB call lightweight.
    const currentUser = await User.findById(decoded.userId).select('role').lean();

    if (!currentUser) {
      return next(
        new AppError(
          'The account associated with this token no longer exists. Please register or log in again.',
          401,
        ),
      );
    }

    // ── Step 4: Attach user context to request ────────────────────────────
    req.user = {
      id: decoded.userId,
      role: currentUser.role as UserRole,
      tokenPayload: decoded,
    };

    next();
  },
);

// ─── authorize ───────────────────────────────────────────────────────────────

/**
 * Role-based authorization middleware factory.
 *
 * MUST be chained AFTER `protect` — it relies on `req.user` being set.
 *
 * Usage:
 *   router.delete('/:id', protect, authorize('Admin'), deleteLead);
 *   router.get('/',       protect, authorize('Admin', 'Sales User'), getLeads);
 *
 * @param roles - One or more roles that are permitted to access the route.
 *
 * Throws:
 *   403 – Authenticated user's role is not in the allowed list.
 *   401 – Called without `protect` (req.user is undefined).
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Guard: protect() must run first
    if (!req.user) {
      return next(
        new AppError(
          'You must be authenticated before role authorization is checked.',
          401,
        ),
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This route requires one of: [${roles.join(', ')}]. ` +
            `Your role is: ${req.user.role}.`,
          403,
        ),
      );
    }

    next();
  };
};

// ─── restrictToSelf ──────────────────────────────────────────────────────────

/**
 * Convenience middleware that restricts a route to the resource owner
 * OR any Admin. Reads the user ID from `req.params.id`.
 *
 * MUST be chained after `protect`.
 *
 * Usage:
 *   router.patch('/users/:id', protect, restrictToSelf, updateUser);
 */
export const restrictToSelf = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    return next(new AppError('You must be authenticated first.', 401));
  }

  const isAdmin = req.user.role === 'Admin';
  const isSelf = req.params.id === req.user.id;

  if (!isAdmin && !isSelf) {
    return next(
      new AppError(
        'You can only perform this action on your own account.',
        403,
      ),
    );
  }

  next();
};
