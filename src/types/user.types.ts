// ─────────────────────────────────────────────────────────────────────────────
// src/types/user.types.ts
// TypeScript interfaces for the User entity
// ─────────────────────────────────────────────────────────────────────────────

import { Document, Types } from 'mongoose';

/** Allowed roles in the system */
export type UserRole = 'Admin' | 'Sales User';

/**
 * Plain User data shape (no Mongoose internals).
 * Used for request/response DTOs and business logic.
 */
export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mongoose Document type — extends IUser with Mongoose Document fields.
 * Used when working with Mongoose model instances.
 */
export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;

  /** Instance method: compare plain-text password to stored hash */
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Safe user representation — omits the password field.
 * Return this shape in API responses instead of the full document.
 */
export type IUserPublic = Omit<IUser, 'password'> & { _id: string };
