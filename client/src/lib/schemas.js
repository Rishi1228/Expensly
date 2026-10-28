import { z } from 'zod';

/** Amount typed into a text box: positive, up to 2 decimals. */
export const amountField = z
  .string()
  .trim()
  .min(1, 'Enter an amount')
  .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (up to 2 decimals)')
  .refine((v) => Number(v) > 0, 'Amount must be greater than 0');
