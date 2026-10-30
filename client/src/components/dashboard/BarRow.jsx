import { ChevronRight } from 'lucide-react';
import { formatMoney } from '../../lib/format.js';

/**
 * One ranked row: label, amount, share, and a single-hue bar scaled to the largest row.
 * `badge` is optional small content after the label (e.g. "You", "Head").
 */
export default function BarRow({ label, icon, total, share, max, onClick, badge }) {
  const width = max ? Math.max((total / max) * 100, 1.5) : 0;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick && { type: 'button', onClick })}
      className={`group flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors ${onClick ? 'hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]' : ''}`}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-semibold">{label}</span>
            {badge}
          </span>
          <span className="shrink-0 font-bold tabular-nums">{formatMoney(total)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] transition-[width] duration-500"
              style={{ width: `${width}%` }}
            />
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
