import { DASHBOARD_PERIODS } from '../../lib/format.js';

/** One row of period chips; scrolls sideways on small screens. */
export default function PeriodChips({ value, onChange }) {
  return (
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
            aria-checked={value === p.value}
            onClick={() => onChange(p.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap ring-1 transition-colors ${
              value === p.value
                ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
