import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, toQuery } from '../api/client.js';
import { toISODate } from '../lib/format.js';

// Send the browser's "today" so day boundaries follow the user's timezone.
const q = (range, extra = {}) => toQuery({ ...range, ...extra, today: toISODate(new Date()) });

const statsQuery = (key, path) => ({
  queryKey: ['stats', ...key],
  queryFn: () => api(path),
  placeholderData: keepPreviousData, // keep old numbers on screen while a new period loads
});

export function useSummary(range) {
  return useQuery({
    ...statsQuery(['summary', range], `/stats/summary${q(range)}`),
    select: (r) => r.data,
  });
}

export function useCategoryBreakdown(range) {
  return useQuery({
    ...statsQuery(['by-category', range], `/stats/by-category${q(range)}`),
    select: (r) => r.data,
  });
}

export function useSubcategoryBreakdown(range, categoryId) {
  return useQuery({
    ...statsQuery(
      ['by-subcategory', range, categoryId],
      `/stats/by-subcategory${q(range, { category_id: categoryId })}`,
    ),
    select: (r) => r.data,
    enabled: Boolean(categoryId),
    placeholderData: undefined, // never show another category's subcategories while loading
  });
}

export function useTrend(range) {
  return useQuery(statsQuery(['trend', range], `/stats/trend${q(range)}`));
}
