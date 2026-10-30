/** Display name for a member: their name, or the part of the email before the @. */
export const memberName = (m) => m.full_name || m.email?.split('@')[0] || 'Member';

/** "Head" / "You" pills next to a name. */
export const pillClass =
  'rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300';
export const headPillClass =
  'rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300';
