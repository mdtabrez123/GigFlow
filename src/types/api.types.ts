// ─────────────────────────────────────────────────────────────────────────────
// src/types/api.types.ts
// Shared API response / request types
// ─────────────────────────────────────────────────────────────────────────────

/** Standard success response envelope */
export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

/** Standard paginated response envelope */
export interface ApiPaginated<T = unknown> extends ApiSuccess<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Standard error response envelope — sent by the error middleware */
export interface ApiError {
  success: false;
  message: string;
  /** HTTP status code — mirrors the response status */
  statusCode: number;
  /** Stack trace included only in development mode */
  stack?: string;
}

/** JWT payload stored inside the token */
export interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}
