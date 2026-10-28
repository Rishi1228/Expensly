import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api('/categories').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
}
