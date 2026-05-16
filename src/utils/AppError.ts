// ─────────────────────────────────────────────────────────────────────────────
// src/utils/AppError.ts
// Custom application error class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AppError extends the native Error class to carry an HTTP status code and
 * an `isOperational` flag that distinguishes expected application errors
 * (validation, auth, not-found) from unexpected programming errors.
 *
 * Only operational errors get a structured JSON response.
 * Non-operational errors crash loudly so they're caught early in development.
 */
class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: 'fail' | 'error';
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    // 4xx → 'fail', 5xx → 'error'
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace and exclude the constructor itself
    Error.captureStackTrace(this, this.constructor);

    // Restore prototype chain (needed when extending built-in classes in TS)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export default AppError;
