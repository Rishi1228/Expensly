import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api('/categories').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

/** Category/subcategory changes can relabel existing expenses, so refresh those too. */
function useInvalidateCategories() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['categories'] });
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
    qc.invalidateQueries({ queryKey: ['recurring'] });
  };
}

const mutation = (fn) =>
  function useCategoryMutation() {
    return useMutation({ mutationFn: fn, onSuccess: useInvalidateCategories() });
  };

/** body: { name, icon, color } */
export const useCreateCategory = mutation((body) => api('/categories', { method: 'POST', body }));
export const useDeleteCategory = mutation((id) => api(`/categories/${id}`, { method: 'DELETE' }));
/** { categoryId, name } */
export const useCreateSubcategory = mutation(({ categoryId, name }) =>
  api(`/categories/${categoryId}/subcategories`, { method: 'POST', body: { name } }),
);
export const useDeleteSubcategory = mutation((id) =>
  api(`/subcategories/${id}`, { method: 'DELETE' }),
);
