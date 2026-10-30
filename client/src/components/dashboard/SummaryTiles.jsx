import CategoryIcon from '../CategoryIcon.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import { comparisonLabel, formatMoney } from '../../lib/format.js';
import ChangeBadge from './ChangeBadge.jsx';
import StatTile from './StatTile.jsx';

/** Spent · Change · Avg per day · Top category, from a useSummary() query. */
export default function SummaryTiles({ query, period, spentLabel = 'Spent' }) {
  const s = query.data;
  return (
    <>
      {query.isError && (
        <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:ring-rose-900">
          <ErrorNote className="py-4" message="Couldn’t load the totals." onRetry={query.refetch} />
        </div>
      )}

      {/* Headline tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={spentLabel}
          loading={query.isLoading}
          value={s && formatMoney(s.total)}
          footnote={s && `${s.count} ${s.count === 1 ? 'expense' : 'expenses'}`}
        />
        <StatTile
          label="Change"
          loading={query.isLoading}
          footnote={s && comparisonLabel(period, s.previous)}
        >
          {s && <ChangeBadge pct={s.change_pct} />}
        </StatTile>
        <StatTile
          label="Avg per day"
          loading={query.isLoading}
          value={s && formatMoney(Math.round(s.avg_per_day))}
          footnote={s && `over ${s.days} ${s.days === 1 ? 'day' : 'days'}`}
        />
        <StatTile label="Top category" loading={query.isLoading}>
          {s?.top_category ? (
            <>
              <p className="mt-1 flex min-w-0 items-center gap-2">
                <CategoryIcon icon={s.top_category.icon} color={s.top_category.color} size="sm" />
                <span className="truncate text-lg font-semibold">{s.top_category.name}</span>
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {formatMoney(s.top_category.total)} · {Math.round(s.top_category.share)}% of spend
              </p>
            </>
          ) : (
            s && <p className="mt-1 text-2xl font-semibold text-slate-400">—</p>
          )}
        </StatTile>
      </div>
    </>
  );
}
