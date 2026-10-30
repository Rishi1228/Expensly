import { Repeat } from 'lucide-react';
import { formatMoney } from '../lib/format.js';
import CategoryIcon from './CategoryIcon.jsx';

/**
 * One expense line. Without onClick it is read-only (e.g. another family member's
 * expense). `memberName` is shown first in the subtitle on the family dashboard.
 */
export default function ExpenseRow({ expense, onClick, memberName }) {
  const { category, subcategory, description, amount, recurring_id } = expense;
  const title = subcategory ? subcategory.name : category.name;
  const subtitle = [memberName, subcategory && category.name, description]
    .filter(Boolean)
    .join(' · ');
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      {...(onClick && { type: 'button', onClick })}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
        onClick ? 'transition-colors hover:bg-slate-900/[0.025] dark:hover:bg-white/[0.03]' : ''
      }`}
    >
      <CategoryIcon icon={category.icon} color={category.color} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-semibold">
          {title}
          {recurring_id && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
              <Repeat className="size-3" aria-hidden /> Recurring
            </span>
          )}
        </p>
        {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
      </div>
      <p className="shrink-0 font-bold tabular-nums">{formatMoney(amount)}</p>
    </Tag>
  );
}
