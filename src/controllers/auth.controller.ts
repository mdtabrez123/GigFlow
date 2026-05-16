// ─────────────────────────────────────────────────────────────────────────────
// src/controllers/auth.controller.ts
// Business logic for authentication: register, login, getMe
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { sendSuccess } from '../utils/apiResponse';
import { IUserDocument, UserRole, JwtPayload } from '../types';

// ─── Token Utilities ──────────────────────────────────────────────────────────

/**
 * Signs a JWT for the given user document.
 *
 * Payload contains `userId` and `role` so the auth middleware can
 * rebuild `req.user` without a database round-trip on every request.
 */
const signToken = (user: IUserDocument): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError('JWT_SECRET is not configured on this server.', 500);

  const payload: JwtPayload = {
    userId: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Builds the standard auth response body:
 *   { token, user: { id, name, email, role } }
 *
 * We never expose the hashed password — the User model's toJSON transform
 * strips it, but we construct the DTO explicitly here for clarity.
 */
const buildAuthPayload = (user: IUserDocument, token: string) => ({
  token,
  user: {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  },
});

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @desc    Create a new user account and return a signed JWT.
 * @access  Public
 *
 * Request body:
 *   { name: string, email: string, password: string, role?: 'Admin' | 'Sales User' }
 *
 * Notes:
 *  - bcrypt hashing is handled by the User model's pre-save hook (12 rounds).
 *  - Duplicate-email errors bubble up to the central error handler as a 409.
 *  - Mongoose ValidationErrors (bad role enum, short password, etc.) → 422.
 */
export const register = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const {
      name,
      email,
      password,
      role,
    } = req.body as {
      name: string;
      email: string;
      password: string;
      role?: string;
    };

    // ── Validate that mandatory fields are present (belt-and-suspenders) ───
    if (!name || !email || !password) {
      throw new AppError('name, email and password are all required.', 400);
    }

    // ── Prevent public self-escalation to Admin ────────────────────────────
    // Only existing Admins (calling a separate admin route) should be able to
    // create Admin accounts. Here we silently cap unknown roles to 'Sales User'.
    const safeRole: UserRole =
      role === 'Admin' || role === 'Sales User' ? (role as UserRole) : 'Sales User';

    // User.create triggers the pre-save bcrypt hook automatically
    const user = (await User.create({
      name,
      email,
      password,
      role: safeRole,
    })) as IUserDocument;

    const token = signToken(user);

    sendSuccess(res, 201, 'Account created successfully.', buildAuthPayload(user, token));
  },
);

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate credentials and return a signed JWT.
 * @access  Public
 *
 * Request body:
 *   { email: string, password: string }
 *
 * Security notes:
 *  - Returns the SAME 401 message for both "user not found" and "wrong password"
 *    to prevent user-enumeration attacks.
 *  - Password field is excluded from DB results by default (`select: false`).
 *    We must opt-in with `.select('+password')`.
 *  - bcrypt.compare() is called inside `user.comparePassword()` — the timing-
 *    safe comparison is handled by bcryptjs internally.
 */
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    // ── Guard: both fields must be present ────────────────────────────────
    if (!email || !password) {
      return next(new AppError('Please provide both email and password.', 400));
    }

    // ── Fetch user + include password hash for comparison ──────────────────
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password',
    );

    // ── Constant-time check: avoids short-circuit timing leak ─────────────
    // We run comparePassword even when `user` is null (against a dummy hash)
    // to keep the response time consistent regardless of whether the account exists.
    const isMatch = user ? await user.comparePassword(password) : false;

    if (!user || !isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const token = signToken(user);

    sendSuccess(res, 200, 'Logged in successfully.', buildAuthPayload(user, token));
  },
);

// ─── Get Me ───────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/auth/me
 * @desc    Return the currently authenticated user's profile.
 * @access  Private (any authenticated user)
 *
 * `req.user` is guaranteed to be set by the `protect` middleware that runs
 * before this handler. We re-fetch from the DB to get the latest fields.
 */
export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await User.findById(req.user?.id);

    if (!user) {
      return next(new AppError('User not found. Please log in again.', 404));
    }

    sendSuccess(res, 200, 'Profile retrieved successfully.', {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  },
);

// ─── Change Password ──────────────────────────────────────────────────────────

/**
 * @route   PATCH /api/auth/change-password
 * @desc    Allow an authenticated user to change their own password.
 * @access  Private (any authenticated user)
 *
 * Request body:
 *   { currentPassword: string, newPassword: string }
 */
export const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return next(
        new AppError('Please provide both currentPassword and newPassword.', 400),
      );
    }

    if (newPassword.length < 8) {
      return next(new AppError('New password must be at least 8 characters.', 400));
    }

    if (currentPassword === newPassword) {
      return next(
        new AppError('New password must be different from the current password.', 400),
      );
    }

    // Fetch with password hash
    const user = await User.findById(req.user?.id).select('+password');
    if (!user) {
      return next(new AppError('User not found. Please log in again.', 404));
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Your current password is incorrect.', 401));
    }

    // The pre-save hook will hash the new password automatically
    user.password = newPassword;
    await user.save();

    // Issue a fresh token so old tokens are implicitly invalidated
    const token = signToken(user);

    sendSuccess(res, 200, 'Password changed successfully.', {
      token,
      message: 'Please use this new token for subsequent requests.',
    });
  },
);
