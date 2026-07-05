import { z } from 'zod';
import { ReportStatus, ReportType, Severity } from '@/types';

// ─── Create Report ────────────────────────────────────────────────────────────

export const createReportSchema = z.object({
  title: z
    .string()
    .min(5,   'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters')
    .trim(),

  description: z
    .string()
    .min(20,   'Description must be at least 20 characters')
    .max(1000, 'Description must be at most 1000 characters')
    .trim(),

  type: z.nativeEnum(ReportType),

  severity: z.nativeEnum(Severity),

  latitude: z
    .number()
    .min(-90,  'Latitude must be between -90 and 90')
    .max(90,   'Latitude must be between -90 and 90'),

  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180,  'Longitude must be between -180 and 180'),

  address: z
    .string()
    .min(5,   'Address must be at least 5 characters')
    .max(200, 'Address must be at most 200 characters')
    .trim(),

  ward: z
    .string()
    .max(100, 'Ward name is too long')
    .trim()
    .optional(),

  tags: z
    .array(z.string().max(30, 'Each tag must be at most 30 characters').trim())
    .max(5, 'Maximum of 5 tags allowed')
    .optional()
    .default([]),
});

// ─── Update Report ────────────────────────────────────────────────────────────

export const updateReportSchema = createReportSchema
  .omit({ latitude: true, longitude: true })
  .partial()
  .extend({
    latitude: z
      .number()
      .min(-90,  'Latitude must be between -90 and 90')
      .max(90,   'Latitude must be between -90 and 90')
      .optional(),
    longitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180,  'Longitude must be between -180 and 180')
      .optional(),
  });

// ─── Report Query (Pagination + Filters) ─────────────────────────────────────

export const reportQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50, 'Limit must be at most 50')
    .default(10),

  status:   z.nativeEnum(ReportStatus).optional(),
  severity: z.nativeEnum(Severity).optional(),
  type:     z.nativeEnum(ReportType).optional(),

  ward: z.string().trim().optional(),

  sortBy: z
    .enum(['createdAt', 'upvoteCount', 'viewCount'])
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),

  search: z
    .string()
    .max(100, 'Search query is too long')
    .trim()
    .optional(),
});

// ─── Exported Types ───────────────────────────────────────────────────────────

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReportQueryInput  = z.infer<typeof reportQuerySchema>;
