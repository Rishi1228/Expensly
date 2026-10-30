import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, toQuery } from '../api/client.js';
import { toISODate } from '../lib/format.js';

/**
 * Where stats come from. Personal by default; the family dashboard passes
 * familyScope(member) so the same hooks and components work for both.
 */
export const PERSONAL = { base: '/stats', params: {} };
export const familyScope = (member) => ({ base: '/family/stats', params: { member } });

// Send the browser's "today" so day boundaries follow the user's timezone.
const q = (range, extra = {}) => toQuery({ ...range, ...extra, today: toISODate(new Date()) });

// Keys start with 'stats' so saving an expense refreshes personal and family numbers alike.
const statsQuery = (scope, key, path, extra = {}) => ({
  queryKey: ['stats', scope.base, scope.params, ...key],
  queryFn: () => api(`${scope.base}${path}${q(key[1], { ...scope.params, ...extra })}`),
  placeholderData: keepPreviousData, // keep old numbers on screen while a new period loads
});

export function useSummary(range, scope = PERSONAL) {
  return useQuery({
    ...statsQuery(scope, ['summary', range], '/summary'),
    select: (r) => r.data,
  });
}

export function useCategoryBreakdown(range, scope = PERSONAL) {
  return useQuery({
    ...statsQuery(scope, ['by-category', range], '/by-category'),
    select: (r) => r.data,
  });
}

export function useSubcategoryBreakdown(range, categoryId, scope = PERSONAL) {
  return useQuery({
    ...statsQuery(scope, ['by-subcategory', range, categoryId], '/by-subcategory', {
      category_id: categoryId,
    }),
    select: (r) => r.data,
    enabled: Boolean(categoryId),
    placeholderData: undefined, // never show another category's subcategories while loading
  });
}

export function useTrend(range, scope = PERSONAL) {
  return useQuery(statsQuery(scope, ['trend', range], '/trend'));
}
