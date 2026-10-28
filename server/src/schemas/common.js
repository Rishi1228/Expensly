import { z } from 'zod';

export const idParam = z.object({ id: z.uuid('Invalid id') });

export const isoDate = z.iso.date('Use YYYY-MM-DD');

/** Optional text: trims, and turns empty strings into null. */
export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform((v) => (v === '' ? null : v))
    .nullish();

export const name = z.string().trim().min(1, 'Name is required').max(50);
