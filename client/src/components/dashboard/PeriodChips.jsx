import { DASHBOARD_PERIODS } from '../../lib/format.js';

/** One row of period chips; scrolls sideways on small screens. */
export default function PeriodChips({ value, onChange }) {
  return (
    <div
      className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
      role="radiogroup"
      aria-label="Period"
    >
      <div className="flex w-max gap-1 rounded-2xl bg-slate-900/[0.04] p-1 ring-1 ring-slate-200/70 dark:bg-white/[0.04] dark:ring-white/[0.06]">
        {DASHBOARD_PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={value === p.value}
            onClick={() => onChange(p.value)}
            className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-all ${
              value === p.value
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-white/10'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
