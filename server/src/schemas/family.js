import { z } from 'zod';
import { isoDate, name } from './common.js';
import { rangeQuery as personalRange, subcategoryQuery, trendQuery } from './stats.js';

export const createFamily = z.object({ name });

export const updateFamily = z
  .object({ name: name.optional(), members_can_view_all: z.boolean().optional() })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const inviteBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
});

export const userIdBody = z.object({ user_id: z.uuid('Pick a member') });
export const userIdParam = z.object({ userId: z.uuid('Invalid id') });

// Family stats take an optional member, on top of the personal stats filters.
const member = { member: z.uuid().optional() };
export const familyRangeQuery = personalRange.safeExtend(member);
export const familyTrendQuery = trendQuery.safeExtend(member);
export const familySubcategoryQuery = subcategoryQuery.safeExtend(member);
export const byMemberQuery = personalRange;

export const familyExpensesQuery = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    category_id: z.uuid().optional(),
    ...member,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must be on or before "to"',
    path: ['from'],
  });
