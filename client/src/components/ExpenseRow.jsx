import { Repeat } from 'lucide-react';
import { formatMoney } from '../lib/format.js';
import CategoryIcon from './CategoryIcon.jsx';

export default function ExpenseRow({ expense, onClick }) {
  const { category, subcategory, description, amount, recurring_id } = expense;
  const title = subcategory ? subcategory.name : category.name;
  const subtitle = [subcategory && category.name, description].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <CategoryIcon icon={category.icon} color={category.color} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-medium">
          {title}
          {recurring_id && (
            <span className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Repeat className="size-3" aria-hidden /> Recurring
            </span>
          )}
        </p>
        {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
      </div>
      <p className="shrink-0 font-semibold tabular-nums">{formatMoney(amount)}</p>
    </button>
  );
}
