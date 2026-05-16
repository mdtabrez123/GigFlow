// ─────────────────────────────────────────────────────────────────────────────
// src/models/Lead.model.ts
// Mongoose schema + model for the Lead entity
// ─────────────────────────────────────────────────────────────────────────────

import { Schema, model } from 'mongoose';
import { ILeadDocument, LeadStatus, LeadSource } from '../types/lead.types';

/** All valid status values derived from the union type */
const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Lost'];

/** All valid source values derived from the union type */
const LEAD_SOURCES: LeadSource[] = ['Website', 'Instagram', 'Referral'];

const leadSchema = new Schema<ILeadDocument>(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },

    email: {
      type: String,
      required: [true, 'Lead email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },

    status: {
      type: String,
      enum: {
        values: LEAD_STATUSES,
        message: `Status must be one of: ${LEAD_STATUSES.join(', ')}`,
      },
      default: 'New',
    },

    source: {
      type: String,
      required: [true, 'Lead source is required'],
      enum: {
        values: LEAD_SOURCES,
        message: `Source must be one of: ${LEAD_SOURCES.join(', ')}`,
      },
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User', // references the User model for population
    },
  },
  {
    timestamps: true, // auto-manages createdAt & updatedAt
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        // Expose _id as id in responses
        ret['id'] = ret['_id'];
        delete ret['_id'];
        return ret;
      },
    },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

/** Speed up common filter queries */
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 }); // Most recent first

/** Compound index for filtered list queries */
leadSchema.index({ status: 1, source: 1, createdAt: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────

const Lead = model<ILeadDocument>('Lead', leadSchema);
export default Lead;
