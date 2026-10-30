import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, toQuery } from '../api/client.js';
import { toISODate } from '../lib/format.js';

/** { family, is_head, members, invites, received_invites } — family is null when not in one. */
export function useFamily() {
  return useQuery({
    queryKey: ['family'],
    queryFn: () => api('/family').then((r) => r.data),
  });
}

/**
 * One mutation per family action. Membership or visibility changes affect what the
 * family stats show, so those are refreshed as well.
 */
function useFamilyAction(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family'] });
      qc.invalidateQueries({ queryKey: ['stats', '/family/stats'] });
      qc.invalidateQueries({ queryKey: ['expenses', 'family'] });
    },
  });
}

export const useCreateFamily = () =>
  useFamilyAction((name) => api('/family', { method: 'POST', body: { name } }));

export const useUpdateFamily = () =>
  useFamilyAction((body) => api('/family', { method: 'PUT', body }));

export const useDeleteFamily = () => useFamilyAction(() => api('/family', { method: 'DELETE' }));

export const useInvite = () =>
  useFamilyAction((email) => api('/family/invites', { method: 'POST', body: { email } }));

export const useCancelInvite = () =>
  useFamilyAction((id) => api(`/family/invites/${id}`, { method: 'DELETE' }));

export const useRespondInvite = () =>
  useFamilyAction(({ id, accept }) =>
    api(`/family/invites/${id}/${accept ? 'accept' : 'decline'}`, { method: 'POST' }),
  );

export const useRemoveMember = () =>
  useFamilyAction((userId) => api(`/family/members/${userId}`, { method: 'DELETE' }));

export const useLeaveFamily = () => useFamilyAction(() => api('/family/leave', { method: 'POST' }));

export const useTransferHead = () =>
  useFamilyAction((userId) =>
    api('/family/transfer', { method: 'POST', body: { user_id: userId } }),
  );

// ---------------------------------------------------------------------------
// Family dashboard data (summary/category/trend use useStats.js with familyScope)
// ---------------------------------------------------------------------------

const today = () => toISODate(new Date());

/** Spend per member; hidden members come back as one "Other members" row (user_id null). */
export function useMemberBreakdown(range) {
  return useQuery({
    queryKey: ['stats', '/family/stats', 'by-member', range],
    queryFn: () => api(`/family/stats/by-member${toQuery({ ...range, today: today() })}`),
    select: (r) => r.data,
    placeholderData: keepPreviousData,
  });
}

/** Recent expenses of the members I'm allowed to see, each with `member: { user_id, name }`. */
export function useFamilyExpenses(filters, limit = 8) {
  return useQuery({
    queryKey: ['expenses', 'family', filters, limit],
    queryFn: () => api(`/family/expenses${toQuery({ ...filters, limit })}`),
    placeholderData: keepPreviousData,
  });
}
