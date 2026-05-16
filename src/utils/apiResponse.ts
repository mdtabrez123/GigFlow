// ─────────────────────────────────────────────────────────────────────────────
// src/utils/apiResponse.ts
// Helper functions for consistent JSON response shaping
// ─────────────────────────────────────────────────────────────────────────────

import { Response } from 'express';
import { ApiSuccess, ApiPaginated } from '../types/api.types';

/**
 * Send a standard success JSON response.
 *
 * @example
 * sendSuccess(res, 200, 'User created', { user });
 */
export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
): Response<ApiSuccess<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a paginated list response.
 *
 * @example
 * sendPaginated(res, 200, 'Leads fetched', leads, { total: 100, page: 1, limit: 10, totalPages: 10 });
 */
export const sendPaginated = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T[],
  pagination: ApiPaginated<T>['pagination'],
): Response<ApiPaginated<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};
