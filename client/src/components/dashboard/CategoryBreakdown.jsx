import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChartBar, ChevronRight } from 'lucide-react';
import { useCategoryBreakdown, useSubcategoryBreakdown } from '../../hooks/useStats.js';
import { formatMoney } from '../../lib/format.js';
import CategoryIcon from '../CategoryIcon.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import Spinner from '../ui/Spinner.jsx';
import { cardClass } from './StatTile.jsx';

/** One ranked row: label, amount, share, and a single-hue bar scaled to the largest row. */
function BarRow({ label, icon, total, share, max, onClick }) {
  const width = max ? Math.max((total / max) * 100, 1.5) : 0;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick && { type: 'button', onClick })}
      className={`group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${onClick ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60' : ''}`}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate font-medium">{label}</span>
          <span className="shrink-0 font-semibold tabular-nums">{formatMoney(total)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-[#6366f1]" style={{ width: `${width}%` }} />
          </div>
          <span className="w-10 shrink-0 text-right text-xs text-slate-500 tabular-nums">
            {Math.round(share)}%
          </span>
        </div>
      </div>
      {onClick && (
        <ChevronRight
          className="size-4 shrink-0 text-slate-400 group-hover:text-slate-600"
          aria-hidden
        />
      )}
    </Tag>
  );
}

/** "Where your money goes": categories ranked by spend; tap one to see its subcategories. */
export default function CategoryBreakdown({ range, period }) {
  const [selected, setSelected] = useState(null);
  const { data: categories, isLoading, isError, refetch } = useCategoryBreakdown(range);
  const {
    data: subs,
    isLoading: subsLoading,
    isError: subsError,
    refetch: refetchSubs,
  } = useSubcategoryBreakdown(range, selected?.category_id);

  // If the period changes and the drilled-in category has no spend any more, go back up.
  const current = selected && categories?.find((c) => c.category_id === selected.category_id);
  const drill = current ?? null;

  return (
    <section className={cardClass} aria-labelledby="breakdown-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        {drill ? (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="-ml-1 flex items-center gap-1 rounded-lg px-1 py-0.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span id="breakdown-title">{drill.name}</span>
          </button>
        ) : (
          <h2 id="breakdown-title" className="font-medium">
            Where your money goes
          </h2>
        )}
        {drill && (
          <Link
            to={`/expenses?category=${drill.category_id}&period=${period}`}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
          >
            View expenses
          </Link>
        )}
      </div>

      {isLoading || (drill && subsLoading) ? (
        <Spinner />
      ) : isError || (drill && subsError) ? (
        <ErrorNote
          message="Couldn’t load the breakdown."
          onRetry={isError ? refetch : refetchSubs}
        />
      ) : !categories?.length ? (
        <div className="flex flex-col items-center py-10 text-center text-sm text-slate-500">
          <ChartBar className="mb-2 size-8 text-slate-400" aria-hidden />
          No spending in this period.
        </div>
      ) : drill ? (
        <div className="space-y-0.5">
          {subs?.map((s) => (
            <BarRow
              key={s.subcategory_id ?? 'none'}
              label={s.name}
              total={s.total}
              share={s.share}
              max={subs[0].total}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          {categories.map((c) => (
            <BarRow
              key={c.category_id}
              label={c.name}
              icon={<CategoryIcon icon={c.icon} color={c.color} size="sm" />}
              total={c.total}
              share={c.share}
              max={categories[0].total}
              onClick={() => setSelected(c)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
