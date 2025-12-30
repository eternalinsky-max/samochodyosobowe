import { z } from 'zod';

// Валідація ID для job
export const JobIdSchema = z
  .string()
  .trim()
  .min(1, 'Invalid id')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid id format');
