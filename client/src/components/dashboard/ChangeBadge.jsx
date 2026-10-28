import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

/**
 * Spending change vs the previous period. For spending, "up" is the warning state,
 * so it gets rose + an up arrow; "down" gets emerald + a down arrow. Icon + words, never color alone.
 */
export default function ChangeBadge({ pct }) {
  if (pct === null || pct === undefined) {
    return <p className="mt-1 text-2xl font-semibold text-slate-400">—</p>;
  }
  const flat = Math.abs(pct) < 0.5;
  const up = pct > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const tone = flat
    ? 'text-slate-600 dark:text-slate-300'
    : up
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <p className={`mt-1 flex items-center gap-1 text-2xl font-semibold tabular-nums ${tone}`}>
      <Icon className="size-6 shrink-0" aria-hidden />
      {flat ? 'Same' : `${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`}
      <span className="sr-only">{flat ? 'no change' : up ? 'more spent' : 'less spent'}</span>
    </p>
  );
}
