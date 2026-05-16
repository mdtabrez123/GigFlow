// ─────────────────────────────────────────────────────────────────────────────
// src/models/User.model.ts
// Mongoose schema + model for the User entity
// ─────────────────────────────────────────────────────────────────────────────

import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserDocument, UserRole } from '../types/user.types';

/** All valid role values derived from the union type */
const USER_ROLES: UserRole[] = ['Admin', 'Sales User'];

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      // Never return the password field in query results by default
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: `Role must be one of: ${USER_ROLES.join(', ')}`,
      },
      default: 'Sales User',
    },
  },
  {
    timestamps: true, // auto-manages createdAt & updatedAt
    versionKey: false, // removes __v field
    toJSON: {
      // Remove password from JSON output even if accidentally selected
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['password'];
        return ret;
      },
    },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Note: email index is created automatically by `unique: true` in the field definition above.

// ─── Pre-save Hook: Hash password before storing ──────────────────────────────

userSchema.pre('save', async function () {
  // Only hash when the password field is being modified
  if (!this.isModified('password')) return;

  const SALT_ROUNDS = 12;
  this.password = await bcrypt.hash(this['password'] as string, SALT_ROUNDS);
});

// ─── Instance Method: Compare plain password with stored hash ─────────────────

userSchema.methods['comparePassword'] = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this['password'] as string);
};

// ─── Export ───────────────────────────────────────────────────────────────────

const User = model<IUserDocument>('User', userSchema);
export default User;
