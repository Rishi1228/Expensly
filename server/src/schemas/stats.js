import { z } from 'zod';
import { isoDate } from './common.js';

const rangeFields = {
  from: isoDate.optional(),
  to: isoDate.optional(),
  // The client's local "today", so day boundaries follow the user's timezone, not the server's.
  today: isoDate.optional(),
};

const validRange = [
  (q) => !q.from || !q.to || q.from <= q.to,
  { message: '"from" must be on or before "to"', path: ['from'] },
];

export const rangeQuery = z.object(rangeFields).refine(...validRange);

export const trendQuery = z
  .object({ ...rangeFields, granularity: z.enum(['day', 'month']).optional() })
  .refine(...validRange);

export const subcategoryQuery = z
  .object({ ...rangeFields, category_id: z.uuid('category_id is required') })
  .refine(...validRange);
