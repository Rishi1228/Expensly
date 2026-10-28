import { z } from 'zod';
import { name, optionalText } from './common.js';

export const createCategory = z.object({
  name,
  icon: optionalText(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #22c55e')
    .nullish(),
});

export const createSubcategory = z.object({ name });
