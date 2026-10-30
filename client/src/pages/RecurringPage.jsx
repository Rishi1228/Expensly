import { useState } from 'react';
import { toast } from 'sonner';
import { Pause, Play, Plus, Repeat } from 'lucide-react';
import { useRecurringList, useSaveRecurring } from '../hooks/useRecurring.js';
import { formatDueLabel, formatMoney, formatSchedule, monthlyEquivalent } from '../lib/format.js';
import CategoryIcon from '../components/CategoryIcon.jsx';
import RecurringForm from '../components/RecurringForm.jsx';
import StatTile from '../components/dashboard/StatTile.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const listClass = 'card divide-y divide-slate-100 overflow-hidden dark:divide-white/[0.06]';

const billTitle = (b) => b.description || b.subcategory?.name || b.category.name;

export default function RecurringPage() {
  const { data: bills, isLoading, isError, error } = useRecurringList();
  // dialog.key remounts the form so it always starts fresh
  const [dialog, setDialog] = useState({ open: false, bill: null, key: 0 });
  const openAdd = () => setDialog((d) => ({ open: true, bill: null, key: d.key + 1 }));
  const openEdit = (bill) => setDialog((d) => ({ open: true, bill, key: d.key + 1 }));
  const close = () => setDialog((d) => ({ ...d, open: false }));

  const active = bills?.filter((b) => b.is_active) ?? [];
  const paused = bills?.filter((b) => !b.is_active) ?? [];
  const perMonth = active.reduce((s, b) => s + monthlyEquivalent(b.amount, b.frequency), 0);
  const next = active[0]; // the API sorts active bills by next due date

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight md:text-3xl">
            Recurring bills
          </h1>
          <p className="text-sm text-slate-500">
            Logged as expenses automatically on each due date.
          </p>
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="size-4" aria-hidden /> <span className="hidden sm:inline">Add bill</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <EmptyState icon={Repeat} title="Couldn't load recurring bills" message={error.message} />
      ) : bills.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring bills yet"
          message="Add rent, OTT subscriptions or the house-help wage once, and they'll be logged for you every time they're due."
          action={
            <Button onClick={openAdd}>
              <Plus className="size-4" aria-hidden /> Add a bill
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand relative min-w-0 overflow-hidden rounded-3xl p-5 text-white shadow-glow">
              <div
                className="absolute -top-12 -right-8 size-36 rounded-full bg-white/15 blur-2xl"
                aria-hidden
              />
              <p className="relative text-[11px] font-semibold tracking-[0.08em] text-white/75 uppercase">
                Per month (approx.)
              </p>
              <p className="relative mt-2 truncate text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">
                {formatMoney(Math.round(perMonth))}
              </p>
              <p className="relative mt-1 truncate text-xs text-white/80">
                From {active.length} active {active.length === 1 ? 'bill' : 'bills'}
              </p>
            </div>
            <StatTile
              label="Next bill"
              value={next ? formatDueLabel(next.next_due_date) : '—'}
              footnote={
                next ? `${billTitle(next)} · ${formatMoney(next.amount)}` : 'All bills paused'
              }
            />
          </div>

          {active.length > 0 && (
            <section>
              <h2 className="eyebrow mb-2.5 px-1">Active</h2>
              <div className={listClass}>
                {active.map((b) => (
                  <BillRow key={b.id} bill={b} onEdit={() => openEdit(b)} />
                ))}
              </div>
            </section>
          )}

          {paused.length > 0 && (
            <section>
              <h2 className="eyebrow mb-2.5 px-1">Paused</h2>
              <div className={listClass}>
                {paused.map((b) => (
                  <BillRow key={b.id} bill={b} onEdit={() => openEdit(b)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal
        open={dialog.open}
        onClose={close}
        title={dialog.bill ? 'Edit recurring bill' : 'Add recurring bill'}
      >
        <RecurringForm key={dialog.key} bill={dialog.bill} onDone={close} />
      </Modal>
    </div>
  );
}

function BillRow({ bill, onEdit }) {
  const toggle = useSaveRecurring();
  const { category, subcategory, amount, frequency, start_date, next_due_date, is_active } = bill;
  const title = billTitle(bill);
  const subtitle = [
    is_active ? `Next: ${formatDueLabel(next_due_date)}` : null,
    formatSchedule(frequency, start_date),
    title !== (subcategory?.name ?? category.name) ? (subcategory?.name ?? category.name) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const onToggle = () =>
    toggle.mutate(
      { id: bill.id, is_active: !is_active },
      {
        onSuccess: ({ logged }) =>
          toast.success(
            is_active
              ? `${title} paused`
              : `${title} resumed${logged ? ' · logged today’s bill' : ''}`,
          ),
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <div className={`flex items-center ${is_active ? '' : 'opacity-60'}`}>
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left transition-colors hover:bg-slate-900/[0.025] dark:hover:bg-white/[0.03]"
      >
        <CategoryIcon icon={category.icon} color={category.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p className="truncate text-sm text-slate-500">{subtitle}</p>
        </div>
        <p className="shrink-0 pr-2 font-semibold tabular-nums">{formatMoney(amount)}</p>
      </button>
      <button
        type="button"
        onClick={onToggle}
        disabled={toggle.isPending}
        className="mr-2 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label={is_active ? `Pause ${title}` : `Resume ${title}`}
        title={is_active ? 'Pause' : 'Resume'}
      >
        {is_active ? (
          <Pause className="size-4" aria-hidden />
        ) : (
          <Play className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
