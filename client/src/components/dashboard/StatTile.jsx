export const cardClass =
  'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';

/** A single headline number with a label and optional footnote. */
export default function StatTile({ label, value, footnote, children, loading }) {
  return (
    <div className={`${cardClass} min-w-0`}>
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      {loading ? (
        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      ) : (
        <>
          {value !== undefined && (
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums">{value}</p>
          )}
          {children}
          {footnote && <p className="mt-1 truncate text-xs text-slate-500">{footnote}</p>}
        </>
      )}
    </div>
  );
}
