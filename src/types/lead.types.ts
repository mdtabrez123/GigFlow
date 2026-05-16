// ─────────────────────────────────────────────────────────────────────────────
// src/types/lead.types.ts
// TypeScript interfaces for the Lead entity
// ─────────────────────────────────────────────────────────────────────────────

import { Document, Types } from 'mongoose';

/** Lifecycle stages a lead can be in */
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost';

/** Acquisition channels for a lead */
export type LeadSource = 'Website' | 'Instagram' | 'Referral';

/**
 * Plain Lead data shape (no Mongoose internals).
 * Used for request/response DTOs and business logic.
 */
export interface ILead {
  name: string;
  email: string;
  status: LeadStatus;
  source: LeadSource;
  /** Optional notes or remarks added by the sales team */
  notes?: string;
  /** The Sales User or Admin who owns/created this lead */
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Mongoose Document type — extends ILead with Mongoose Document fields.
 */
export interface ILeadDocument extends ILead, Document {
  _id: Types.ObjectId;
}

/**
 * DTO used when creating a new lead via POST /api/leads.
 * `createdAt` is auto-generated so it's excluded from the creation payload.
 */
export type CreateLeadDTO = Omit<ILead, 'createdAt' | 'updatedAt'>;

/**
 * DTO used when partially updating a lead via PATCH /api/leads/:id.
 */
export type UpdateLeadDTO = Partial<CreateLeadDTO>;
