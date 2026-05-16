// ─────────────────────────────────────────────────────────────────────────────
// src/middleware/errorHandler.ts
// Centralized error-handling middleware
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MongoServerError } from 'mongodb';
import AppError from '../utils/AppError';
import { ApiError } from '../types/api.types';

// ─── Helper: Transform known error types into AppError ────────────────────────

/**
 * Mongoose CastError — thrown when an invalid ObjectId is passed.
 * e.g. GET /api/leads/not-a-valid-id
 */
const handleCastError = (err: MongooseError.CastError): AppError =>
  new AppError(`Invalid ${err.path}: "${err.value}" is not a valid ID.`, 400);

/**
 * MongoDB duplicate key error (code 11000).
 * e.g. registering with an already-used email.
 */
const handleDuplicateKeyError = (err: MongoServerError): AppError => {
  const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
  const value = err.keyValue?.[field] ?? '';
  return new AppError(
    `Duplicate value for "${field}": "${value}" already exists.`,
    409,
  );
};

/**
 * Mongoose ValidationError — thrown when schema validators fail.
 * e.g. missing required fields, enum mismatch.
 */
const handleValidationError = (
  err: MongooseError.ValidationError,
): AppError => {
  const messages = Object.values(err.errors)
    .map((e) => e.message)
    .join('. ');
  return new AppError(`Validation failed: ${messages}`, 422);
};

/**
 * JWT invalid signature / malformed token.
 */
const handleJwtError = (): AppError =>
  new AppError('Invalid token. Please log in again.', 401);

/**
 * JWT expired token.
 */
const handleJwtExpiredError = (): AppError =>
  new AppError('Your token has expired. Please log in again.', 401);

// ─── Error Senders ────────────────────────────────────────────────────────────

/** Development: expose full stack trace for easier debugging */
const sendDevError = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

/** Production: send only the safe, user-facing fields */
const sendProdError = (err: AppError, res: Response): void => {
  if (err.isOperational) {
    // Known, expected errors — safe to expose
    const body: ApiError = {
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    };
    res.status(err.statusCode).json(body);
  } else {
    // Unknown / programming error — don't leak internal details
    console.error('💥 UNHANDLED ERROR:', err);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ─── Main Error Handler ───────────────────────────────────────────────────────

/**
 * Centralized Express error-handling middleware.
 *
 * Must be registered AFTER all routes and other middleware:
 *   app.use(errorHandler);
 *
 * The four-argument signature `(err, req, res, next)` is required by Express
 * to identify this as an error-handling middleware.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // ── Step 1: Resolve to an AppError ───────────────────────────────────────
  //
  // We never clone `err` with Object.assign — Error.message is non-enumerable
  // and the clone silently loses it, producing an empty message in responses.
  // Instead we build a fresh AppError in every non-AppError branch so the
  // message string is always passed explicitly to the AppError constructor.

  let appError: AppError;

  if (err instanceof MongooseError.CastError) {
    // Invalid ObjectId  e.g. GET /api/leads/not-a-valid-id
    appError = handleCastError(err);

  } else if ((err as MongoServerError).code === 11000) {
    // MongoDB duplicate key  e.g. duplicate email on register
    appError = handleDuplicateKeyError(err as MongoServerError);

  } else if (err instanceof MongooseError.ValidationError) {
    // Mongoose schema validator failed  e.g. missing required field
    appError = handleValidationError(err);

  } else if (err.name === 'JsonWebTokenError') {
    // JWT bad signature / malformed
    appError = handleJwtError();

  } else if (err.name === 'TokenExpiredError') {
    // JWT past its expiry date
    appError = handleJwtExpiredError();

  } else if (err instanceof AppError) {
    // Already a well-formed AppError — use it directly, message intact
    appError = err;

  } else {
    // Unknown / unexpected error — wrap in a generic 500
    // isOperational stays false so we don't leak internals in production
    appError = new AppError(
      err.message || 'An unexpected error occurred.',
      500,
    );
    (appError as { isOperational: boolean }).isOperational = false;
  }

  // ── Step 2: Send response based on environment ────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    sendDevError(appError, res);
  } else {
    sendProdError(appError, res);
  }
};

// ─── 404 Not Found Handler ────────────────────────────────────────────────────

/**
 * Catch-all middleware for unmatched routes.
 * Register this BEFORE the errorHandler but AFTER all valid routes.
 *
 * @example
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
