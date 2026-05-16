// ─────────────────────────────────────────────────────────────────────────────
// src/utils/catchAsync.ts
// Async wrapper — eliminates try/catch boilerplate in route handlers
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express route handler and forwards any rejected promise
 * to the next() error-handling middleware automatically.
 *
 * @example
 * router.get('/users', catchAsync(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
