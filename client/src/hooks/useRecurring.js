import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, toQuery } from '../api/client.js';
import { toISODate } from '../lib/format.js';

// The browser's "today", so bills are logged on the user's local date.
const today = () => toQuery({ today: toISODate(new Date()) });

export function useRecurringList() {
  return useQuery({
    queryKey: ['recurring'],
    queryFn: () => api('/recurring').then((r) => r.data),
  });
}

/** Saving can log a bill that is due today, so spending data is refreshed too. */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['recurring'] });
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
  };
}

/** Creates when no id is given, otherwise updates. Resolves to { data, logged }. */
export function useSaveRecurring() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      id
        ? api(`/recurring/${id}${today()}`, { method: 'PUT', body })
        : api(`/recurring${today()}`, { method: 'POST', body }),
    onSuccess: invalidate,
  });
}

export function useDeleteRecurring() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id) => api(`/recurring/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

/**
 * Once per app load: logs bills due by the user's local today. The daily server
 * job runs at 12:05 UTC, so this makes bills appear first thing in the morning.
 */
export function useLogDueRecurring() {
  const invalidate = useInvalidateAll();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    api(`/recurring/run${today()}`, { method: 'POST' })
      .then(({ logged }) => {
        if (!logged) return;
        invalidate();
        toast.success(`Logged ${logged} recurring ${logged === 1 ? 'bill' : 'bills'}`);
      })
      .catch(() => {}); // not worth bothering the user; the server job will catch up
  }, [invalidate]);
}
