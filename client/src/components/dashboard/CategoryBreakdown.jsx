import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChartBar } from 'lucide-react';
import { PERSONAL, useCategoryBreakdown, useSubcategoryBreakdown } from '../../hooks/useStats.js';
import CategoryIcon from '../CategoryIcon.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import Spinner from '../ui/Spinner.jsx';
import BarRow from './BarRow.jsx';
import { cardClass } from './StatTile.jsx';

/**
 * "Where your money goes": categories ranked by spend; tap one to see its subcategories.
 * `scope` switches between personal and family stats (see useStats.js).
 */
export default function CategoryBreakdown({
  range,
  period,
  scope = PERSONAL,
  title = 'Where your money goes',
}) {
  const [selected, setSelected] = useState(null);
  const { data: categories, isLoading, isError, refetch } = useCategoryBreakdown(range, scope);
  const {
    data: subs,
    isLoading: subsLoading,
    isError: subsError,
    refetch: refetchSubs,
  } = useSubcategoryBreakdown(range, selected?.category_id, scope);

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
            className="-ml-1 flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 font-bold tracking-tight hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span id="breakdown-title">{drill.name}</span>
          </button>
        ) : (
          <h2 id="breakdown-title" className="text-base font-bold tracking-tight">
            {title}
          </h2>
        )}
        {drill && scope === PERSONAL && (
          <Link
            to={`/expenses?category=${drill.category_id}&period=${period}`}
            className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
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
