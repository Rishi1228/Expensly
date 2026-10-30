import { ArrowDownRight, ArrowUpRight, CalendarDays, Minus, Trophy } from 'lucide-react';
import CategoryIcon from '../CategoryIcon.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import { comparisonLabel, formatMoney } from '../../lib/format.js';
import Sparkline from './Sparkline.jsx';
import StatTile from './StatTile.jsx';

/** Spending change as a pill for the gradient hero (icon + words, never color alone). */
function ChangePill({ pct }) {
  if (pct === null || pct === undefined) return null;
  const flat = Math.abs(pct) < 0.5;
  const up = pct > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const amount = Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-sm font-semibold ring-1 ring-white/25">
      <Icon className="size-4" aria-hidden />
      {flat ? 'Same as before' : `${amount}% ${up ? 'more' : 'less'}`}
    </span>
  );
}

function Hero({ s, loading, label, period, trend }) {
  const values = trend?.data?.data?.map((p) => p.total);
  return (
    <div className="bg-brand relative col-span-2 overflow-hidden rounded-3xl p-6 text-white shadow-glow">
      <div
        className="absolute -top-16 -right-10 size-56 rounded-full bg-white/15 blur-2xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-20 left-1/3 size-48 rounded-full bg-fuchsia-400/30 blur-3xl"
        aria-hidden
      />
      <Sparkline values={values} className="absolute right-0 bottom-0 h-14 w-2/5 text-white/70" />
      <div className="relative">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-white/75 uppercase">
          {label}
        </p>
        {loading ? (
          <div className="mt-3 h-11 w-44 animate-pulse rounded-xl bg-white/20" />
        ) : (
          s && (
            <>
              <p className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
                {formatMoney(s.total)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <ChangePill pct={s.change_pct} />
                <span className="text-white/80">
                  {s.previous ? comparisonLabel(period, s.previous) : 'Nothing earlier to compare'}
                </span>
              </div>
              <p className="mt-6 text-sm text-white/75">
                {s.count} {s.count === 1 ? 'expense' : 'expenses'}
              </p>
            </>
          )
        )}
      </div>
    </div>
  );
}

const tileIcon = (Icon) => (
  <span className="hidden size-8 shrink-0 items-center justify-center rounded-xl sm:flex bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
    <Icon className="size-4" aria-hidden />
  </span>
);

/**
 * Gradient hero (total, change, sparkline) + Avg per day + Top category.
 * `trend` is an optional useTrend() query used for the hero sparkline.
 */
export default function SummaryTiles({ query, period, spentLabel = 'Spent', trend }) {
  const s = query.data;
  return (
    <>
      {query.isError && (
        <div className="card ring-rose-200! dark:ring-rose-900!">
          <ErrorNote className="py-4" message="Couldn’t load the totals." onRetry={query.refetch} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Hero s={s} loading={query.isLoading} label={spentLabel} period={period} trend={trend} />
        <StatTile
          label="Avg per day"
          icon={tileIcon(CalendarDays)}
          loading={query.isLoading}
          value={s && formatMoney(Math.round(s.avg_per_day))}
          footnote={s && `over ${s.days} ${s.days === 1 ? 'day' : 'days'}`}
        />
        <StatTile label="Top category" icon={tileIcon(Trophy)} loading={query.isLoading}>
          {s?.top_category ? (
            <>
              <p className="mt-2 flex min-w-0 items-center gap-2">
                <CategoryIcon icon={s.top_category.icon} color={s.top_category.color} size="sm" />
                <span className="truncate text-lg font-bold tracking-tight">
                  {s.top_category.name}
                </span>
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {formatMoney(s.top_category.total)} · {Math.round(s.top_category.share)}%
                <span className="hidden sm:inline"> of spend</span>
              </p>
            </>
          ) : (
            s && <p className="mt-2 text-2xl font-bold text-slate-400">—</p>
          )}
        </StatTile>
      </div>
    </>
  );
}
