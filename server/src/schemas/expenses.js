import { z } from 'zod';
import { isoDate, optionalText } from './common.js';

export const amount = z.coerce
  .number({ error: 'Amount must be a number' })
  .positive('Amount must be greater than 0')
  .max(9_999_999_999.99, 'Amount is too large')
  .transform((n) => Math.round(n * 100) / 100);

export const createExpense = z.object({
  amount,
  category_id: z.uuid('Category is required'),
  subcategory_id: z.uuid().nullish(),
  description: optionalText(500),
  expense_date: isoDate.optional(),
});

export const updateExpense = createExpense
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const listExpensesQuery = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    category_id: z.uuid().optional(),
    subcategory_id: z.uuid().optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must be on or before "to"',
    path: ['from'],
  });
