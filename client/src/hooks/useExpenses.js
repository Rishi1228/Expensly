import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, toQuery } from '../api/client.js';

const PAGE_SIZE = 50;

/** Paged expense list. filters: { from, to, category_id, search } */
export function useExpenseList(filters, options = {}) {
  return useInfiniteQuery({
    ...options,
    queryKey: ['expenses', 'list', filters],
    queryFn: ({ pageParam }) =>
      api(`/expenses${toQuery({ ...filters, page: pageParam, limit: PAGE_SIZE })}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
}

export function useRecentExpenses(limit = 5) {
  return useQuery({
    queryKey: ['expenses', 'recent', limit],
    queryFn: () => api(`/expenses${toQuery({ limit })}`),
  });
}

function useInvalidateSpending() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
  };
}

/** Creates when no id is given, otherwise updates. */
export function useSaveExpense() {
  const invalidate = useInvalidateSpending();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      id
        ? api(`/expenses/${id}`, { method: 'PUT', body })
        : api('/expenses', { method: 'POST', body }),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidateSpending();
  return useMutation({
    mutationFn: (id) => api(`/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
