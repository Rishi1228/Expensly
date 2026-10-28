import { z } from 'zod';
import { isoDate, optionalText } from './common.js';
import { amount } from './expenses.js';

export const createRecurring = z.object({
  amount,
  category_id: z.uuid('Category is required'),
  subcategory_id: z.uuid().nullish(),
  description: optionalText(500),
  frequency: z.enum(['weekly', 'monthly', 'yearly'], {
    error: 'Frequency must be weekly, monthly or yearly',
  }),
  // First due date. Later dates follow from it (same weekday / day of month / date).
  start_date: isoDate,
});

export const updateRecurring = createRecurring
  .extend({ is_active: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

// The client's local "today", so bills are logged on the user's date, not the server's.
export const todayQuery = z.object({ today: isoDate.optional() });
