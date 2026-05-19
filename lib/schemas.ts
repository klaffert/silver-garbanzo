import { z } from 'zod';

export const SeveritySchema = z.enum(['critical', 'warning', 'info']);

export const FindingSchema = z.object({
  severity: SeveritySchema,
  title: z.string(),
  description: z.string(),
  suggestedFix: z.string().optional(),
  lineReference: z.string().optional(),
});

export const ReviewCategorySchema = z.object({
  category: z.enum(['bugs', 'security', 'performance', 'style', 'quick-wins']),
  findings: z.array(FindingSchema),
});

export const ReviewResultSchema = z.object({
  language: z.string(),
  summary: z.string(),
  score: z.number().min(0).max(100),
  categories: z.array(ReviewCategorySchema),
});

export const ReviewRequestSchema = z.object({
  code: z.string().min(10).max(10000),
  language: z.string(),
});