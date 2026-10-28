import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Plus } from 'lucide-react';
import { api } from '../api/client.js';
import { useRecentExpenses } from '../hooks/useExpenses.js';
import { useSummary, useTrend } from '../hooks/useStats.js';
import { useExpenseDialog } from '../context/expense-dialog.js';
import { PERIODS, formatMoney, parseISODate, periodRange } from '../lib/format.js';
import ExpenseRow from '../components/ExpenseRow.jsx';
import CategoryIcon from '../components/CategoryIcon.jsx';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown.jsx';
import ChangeBadge from '../components/dashboard/ChangeBadge.jsx';
import StatTile, { cardClass } from '../components/dashboard/StatTile.jsx';
import TrendChart from '../components/dashboard/TrendChart.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorNote from '../components/ui/ErrorNote.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const DASHBOARD_PERIODS = PERIODS.filter((p) => p.value !== 'custom');

function comparisonLabel(period, previous) {
  if (!previous) return 'No earlier period to compare';
  const d = parseISODate(previous.from);
  switch (period) {
    case 'this-month':
    case 'last-month':
      return `vs ${d.toLocaleDateString('en-IN', { month: 'long' })} (${formatMoney(previous.total)})`;
    case 'this-year':
      return `vs ${d.getFullYear()} (${formatMoney(previous.total)})`;
    default:
      return `vs previous 3 months (${formatMoney(previous.total)})`;
  }
}

export default function DashboardPage() {
  const { openAdd, openEdit } = useExpenseDialog();
  const [period, setPeriod] = useState('this-month');
  const range = useMemo(() => periodRange(period), [period]);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api('/me').then((r) => r.data),
  });
  const summary = useSummary(range);
  const trend = useTrend(range);
  const recentQuery = useRecentExpenses(5);
  const { data: recent, isLoading: recentLoading } = recentQuery;

  const s = summary.data;
  const firstName = me?.profile?.full_name?.split(' ')[0];
  const periodLabel = DASHBOARD_PERIODS.find((p) => p.value === period).label.toLowerCase();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{firstName ? `Hi, ${firstName}` : 'Dashboard'}</h1>
          <p className="text-sm text-slate-500">Here’s where your money went {periodLabel}.</p>
        </div>
        <div className="hidden md:block">
          <Button onClick={openAdd}>
            <Plus className="size-4" aria-hidden /> Add expense
          </Button>
        </div>
      </div>

      {/* Period filter: one row, scrolls sideways on small screens */}
      <div
        className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
        role="radiogroup"
        aria-label="Period"
      >
        <div className="flex w-max gap-2">
          {DASHBOARD_PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap ring-1 transition-colors ${
                period === p.value
                  ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {summary.isError && (
        <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:ring-rose-900">
          <ErrorNote
            className="py-4"
            message="Couldn’t load your totals."
            onRetry={summary.refetch}
          />
        </div>
      )}

      {/* Headline tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Spent"
          loading={summary.isLoading}
          value={s && formatMoney(s.total)}
          footnote={s && `${s.count} ${s.count === 1 ? 'expense' : 'expenses'}`}
        />
        <StatTile
          label="Change"
          loading={summary.isLoading}
          footnote={s && comparisonLabel(period, s.previous)}
        >
          {s && <ChangeBadge pct={s.change_pct} />}
        </StatTile>
        <StatTile
          label="Avg per day"
          loading={summary.isLoading}
          value={s && formatMoney(Math.round(s.avg_per_day))}
          footnote={s && `over ${s.days} ${s.days === 1 ? 'day' : 'days'}`}
        />
        <StatTile label="Top category" loading={summary.isLoading}>
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

      <TrendChart query={trend} />

      <div className="grid gap-5 lg:grid-cols-2">
        <CategoryBreakdown key={period} range={range} period={period} />

        <section className={cardClass} aria-labelledby="recent-title">
          <div className="mb-1 flex items-center justify-between">
            <h2 id="recent-title" className="font-medium">
              Recent expenses
            </h2>
            <Link
              to="/expenses"
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
            >
              See all <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {recentLoading ? (
            <Spinner />
          ) : recentQuery.isError ? (
            <ErrorNote message="Couldn’t load recent expenses." onRetry={recentQuery.refetch} />
          ) : recent?.data.length ? (
            <div className="-mx-4 divide-y divide-slate-100 dark:divide-slate-800">
              {recent.data.map((e) => (
                <ExpenseRow key={e.id} expense={e} onClick={() => openEdit(e)} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              <p>No expenses yet.</p>
              <Button className="mt-3" onClick={openAdd}>
                <Plus className="size-4" aria-hidden /> Add your first
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
