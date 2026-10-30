import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Plus } from 'lucide-react';
import { api } from '../api/client.js';
import { useRecentExpenses } from '../hooks/useExpenses.js';
import { useSummary, useTrend } from '../hooks/useStats.js';
import { useExpenseDialog } from '../context/expense-dialog.js';
import { DASHBOARD_PERIODS, periodRange } from '../lib/format.js';
import ExpenseRow from '../components/ExpenseRow.jsx';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown.jsx';
import PeriodChips from '../components/dashboard/PeriodChips.jsx';
import { cardClass } from '../components/dashboard/StatTile.jsx';
import SummaryTiles from '../components/dashboard/SummaryTiles.jsx';
import TrendChart from '../components/dashboard/TrendChart.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorNote from '../components/ui/ErrorNote.jsx';
import Spinner from '../components/ui/Spinner.jsx';

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

      <PeriodChips value={period} onChange={setPeriod} />

      <SummaryTiles query={summary} period={period} />

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
