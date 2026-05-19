import type { z } from 'zod';
import type {
  FindingSchema,
  ReviewCategorySchema,
  ReviewResultSchema,
  ReviewRequestSchema,
  SeveritySchema,
} from '@/lib/schemas';

export type Severity = z.infer<typeof SeveritySchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type ReviewCategory = z.infer<typeof ReviewCategorySchema>;
export type ReviewResult = z.infer<typeof ReviewResultSchema>;
export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;