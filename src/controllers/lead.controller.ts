// ─────────────────────────────────────────────────────────────────────────────
// src/controllers/lead.controller.ts
// Business logic for Lead CRUD with advanced filtering, search, sort, pagination
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { SortOrder } from 'mongoose';
import { Lead } from '../models';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { sendSuccess } from '../utils/apiResponse';
import { CreateLeadDTO, UpdateLeadDTO, LeadStatus, LeadSource } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const VALID_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Lost'];
const VALID_SOURCES: LeadSource[] = ['Website', 'Instagram', 'Referral'];

// ─── Query Parameter Types ────────────────────────────────────────────────────

interface LeadListQuery {
  status?: string;
  source?: string;
  search?: string;   // free-text search against name + email
  sort?: 'latest' | 'oldest';
  page?: string;
  limit?: string;
}

// ─── GET /api/leads ───────────────────────────────────────────────────────────

/**
 * @route   GET /api/leads
 * @desc    List leads with combined filtering, text search, sorting and pagination.
 * @access  Admin (all leads) | Sales User (own leads only)
 *
 * Supported query parameters:
 * ┌─────────┬──────────────────────────────────────────────────────────────┐
 * │ Param   │ Description                                                  │
 * ├─────────┼──────────────────────────────────────────────────────────────┤
 * │ status  │ Enum filter: 'New' | 'Contacted' | 'Qualified' | 'Lost'     │
 * │ source  │ Enum filter: 'Website' | 'Instagram' | 'Referral'           │
 * │ search  │ Case-insensitive substring match on name OR email            │
 * │ sort    │ 'latest' (default) → newest first | 'oldest' → oldest first │
 * │ page    │ Page number, 1-indexed (default: 1)                         │
 * │ limit   │ Items per page, max 100 (default: 10)                       │
 * └─────────┴──────────────────────────────────────────────────────────────┘
 *
 * Response shape:
 * {
 *   success: true,
 *   message: string,
 *   data: Lead[],
 *   pagination: { total, page, limit, totalPages, hasNextPage, hasPrevPage }
 * }
 */
export const getLeads = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      status,
      source,
      search,
      sort = 'latest',
      page = String(DEFAULT_PAGE),
      limit = String(DEFAULT_LIMIT),
    } = req.query as LeadListQuery;

    // ── 1. Build the Mongoose filter object ───────────────────────────────

    const filter: Record<string, unknown> = {};

    // Role-based data scoping: Sales Users see only their own leads
    if (req.user?.role === 'Sales User') {
      filter.assignedTo = req.user.id;
    }

    // Enum filters — validated to avoid MongoDB injections from raw strings
    if (status) {
      if (!VALID_STATUSES.includes(status as LeadStatus)) {
        return next(
          new AppError(
            `Invalid status "${status}". Valid values: ${VALID_STATUSES.join(', ')}.`,
            400,
          ),
        );
      }
      filter.status = status as LeadStatus;
    }

    if (source) {
      if (!VALID_SOURCES.includes(source as LeadSource)) {
        return next(
          new AppError(
            `Invalid source "${source}". Valid values: ${VALID_SOURCES.join(', ')}.`,
            400,
          ),
        );
      }
      filter.source = source as LeadSource;
    }

    // ── 2. Full-text search: case-insensitive regex on name OR email ──────
    //
    // We use $regex instead of MongoDB Atlas Search because this is a
    // self-hosted MongoDB setup. For large datasets, add a text index:
    //   leadSchema.index({ name: 'text', email: 'text' });
    // and replace this with: filter.$text = { $search: search }
    if (search && search.trim().length > 0) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    // ── 3. Resolve sort direction ─────────────────────────────────────────
    const sortOrder: SortOrder = sort === 'oldest' ? 1 : -1; // 1 = ASC, -1 = DESC
    const sortQuery: Record<string, SortOrder> = { createdAt: sortOrder };

    // ── 4. Pagination math ────────────────────────────────────────────────
    const pageNum = Math.max(DEFAULT_PAGE, parseInt(page, 10) || DEFAULT_PAGE);
    const limitNum = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT),
    );
    const skip = (pageNum - 1) * limitNum;

    // ── 5. Execute filter + count in parallel ─────────────────────────────
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email role') // join assigned user info
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(), // returns plain JS objects for better performance
      Lead.countDocuments(filter),
    ]);

    // ── 6. Compute pagination metadata ────────────────────────────────────
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: `${total} lead(s) found.`,
      data: leads,
      pagination: {
        total,           // total matching documents in the DB
        page: pageNum,   // current page (1-indexed)
        limit: limitNum, // items per page
        totalPages,      // ceiling of total / limit
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      // Expose the active filters for the client to reflect in the UI
      filters: {
        status: status ?? null,
        source: source ?? null,
        search: search ?? null,
        sort,
      },
    });
  },
);

// ─── GET /api/leads/:id ───────────────────────────────────────────────────────

/**
 * @route   GET /api/leads/:id
 * @desc    Fetch a single lead by its MongoDB ObjectId.
 * @access  Admin | Sales User (own lead only)
 */
export const getLeadById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const lead = await Lead.findById(req.params.id).populate(
      'assignedTo',
      'name email role',
    );

    if (!lead) {
      return next(new AppError(`No lead found with ID: ${req.params.id}`, 404));
    }

    // Ownership check for Sales Users
    if (req.user?.role === 'Sales User') {
      const assignedId = lead.assignedTo?._id || lead.assignedTo;
      if (assignedId?.toString() !== req.user.id) {
        return next(
          new AppError('You do not have permission to view this lead.', 403),
        );
      }
    }

    sendSuccess(res, 200, 'Lead retrieved successfully.', lead);
  },
);

// ─── POST /api/leads ──────────────────────────────────────────────────────────

/**
 * @route   POST /api/leads
 * @desc    Create a new lead. Auto-assigns to the authenticated user if
 *          `assignedTo` is not provided in the request body.
 * @access  Admin | Sales User
 *
 * Request body: CreateLeadDTO
 *   { name, email, status?, source, notes?, assignedTo? }
 */
export const createLead = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as CreateLeadDTO;

    // Auto-assign to the requester when not explicitly provided
    if (!payload.assignedTo && req.user) {
      // Mongoose accepts a string id for ObjectId ref fields
      (payload as Record<string, unknown>).assignedTo = req.user.id;
    }

    const lead = await Lead.create(payload);

    // Populate the assignedTo field so the response is fully resolved
    await lead.populate('assignedTo', 'name email role');

    sendSuccess(res, 201, 'Lead created successfully.', lead);
  },
);

// ─── PATCH /api/leads/:id ─────────────────────────────────────────────────────

/**
 * @route   PATCH /api/leads/:id
 * @desc    Partially update a lead's mutable fields.
 * @access  Admin | Sales User (own lead only)
 *
 * Request body: UpdateLeadDTO (all fields optional)
 */
export const updateLead = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fetch first to enforce ownership before applying the update
    const existing = await Lead.findById(req.params.id);
    if (!existing) {
      return next(new AppError(`No lead found with ID: ${req.params.id}`, 404));
    }

    if (req.user?.role === 'Sales User') {
      const assignedId = existing.assignedTo?._id || existing.assignedTo;
      if (assignedId?.toString() !== req.user.id) {
        return next(
          new AppError('You do not have permission to update this lead.', 403),
        );
      }
    }

    const updates = req.body as UpdateLeadDTO;

    const lead = await Lead.findByIdAndUpdate(req.params.id, updates, {
      new: true,           // return the updated document (not the pre-update one)
      runValidators: true, // run Mongoose validators on the changed fields
    }).populate('assignedTo', 'name email role');

    sendSuccess(res, 200, 'Lead updated successfully.', lead);
  },
);

// ─── DELETE /api/leads/:id ────────────────────────────────────────────────────

/**
 * @route   DELETE /api/leads/:id
 * @desc    Permanently delete a lead.
 * @access  Admin only
 */
export const deleteLead = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return next(new AppError(`No lead found with ID: ${req.params.id}`, 404));
    }

    sendSuccess(res, 200, 'Lead deleted successfully.', null);
  },
);
