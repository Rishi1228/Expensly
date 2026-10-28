import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ReceiptText, Search } from 'lucide-react';
import { useExpenseList } from '../hooks/useExpenses.js';
import { useCategories } from '../hooks/useCategories.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useExpenseDialog } from '../context/expense-dialog.js';
import { PERIODS, formatDayLabel, formatMoney, periodRange, toISODate } from '../lib/format.js';
import ExpenseRow from '../components/ExpenseRow.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { inputClass } from '../components/ui/Field.jsx';

/** Groups a date-sorted list into [{ date, total, items }]. */
function groupByDay(expenses) {
  const groups = [];
  for (const e of expenses) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== e.expense_date) {
      g = { date: e.expense_date, total: 0, items: [] };
      groups.push(g);
    }
    g.items.push(e);
    g.total += Number(e.amount);
  }
  return groups;
}

export default function ExpensesPage() {
  const { openAdd, openEdit } = useExpenseDialog();
  const { data: categories } = useCategories();

  // Links like /expenses?category=<id>&period=last-month open with those filters applied.
  const [params] = useSearchParams();
  const [period, setPeriod] = useState(() =>
    PERIODS.some((p) => p.value === params.get('period')) ? params.get('period') : 'this-month',
  );
  const [custom, setCustom] = useState({ from: '', to: toISODate(new Date()) });
  const [categoryId, setCategoryId] = useState(() => params.get('category') ?? '');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim());

  const filters = useMemo(() => {
    const range = period === 'custom' ? custom : periodRange(period);
    return { ...range, category_id: categoryId, search: debouncedSearch };
  }, [period, custom, categoryId, debouncedSearch]);

  const customInvalid = period === 'custom' && custom.from && custom.to && custom.from > custom.to;
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExpenseList(filters, { enabled: !customInvalid });

  const expenses = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;
  const groups = useMemo(() => groupByDay(expenses), [expenses]);
  const hasFilters = Boolean(categoryId || debouncedSearch);
  const emptyTitle = hasFilters
    ? 'No expenses match'
    : period === 'all'
      ? 'No expenses yet'
      : 'Nothing logged in this period';

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          {!isLoading && (
            <p className="text-sm text-slate-500">
              {total} {total === 1 ? 'expense' : 'expenses'}
            </p>
          )}
        </div>
        <div className="hidden md:block">
          <Button onClick={openAdd}>
            <Plus className="size-4" aria-hidden /> Add expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search descriptions"
            aria-label="Search descriptions"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={inputClass}
            aria-label="Period"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-500">
              From
              <input
                type="date"
                value={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="text-xs text-slate-500">
              To
              <input
                type="date"
                value={custom.to}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                className={`${inputClass} mt-1`}
              />
            </label>
            {customInvalid && (
              <p className="col-span-2 text-sm text-rose-600">“From” must be before “To”.</p>
            )}
          </div>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <EmptyState icon={ReceiptText} title="Couldn't load expenses" message={error.message} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={emptyTitle}
          message={
            hasFilters
              ? 'Try a different period, category or search.'
              : 'Add an expense to see it here.'
          }
          action={
            <Button onClick={openAdd}>
              <Plus className="size-4" aria-hidden /> Add expense
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.date}>
              <div className="mb-2 flex items-baseline justify-between px-1 text-sm">
                <h2 className="font-medium text-slate-600 dark:text-slate-300">
                  {formatDayLabel(g.date)}
                </h2>
                <span className="text-slate-500 tabular-nums">{formatMoney(g.total)}</span>
              </div>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-800 dark:bg-slate-900 dark:ring-slate-800">
                {g.items.map((e) => (
                  <ExpenseRow key={e.id} expense={e} onClick={() => openEdit(e)} />
                ))}
              </div>
            </section>
          ))}
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                loading={isFetchingNextPage}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
