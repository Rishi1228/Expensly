export const cardClass = 'card p-5';

/** A single headline number with a label and optional footnote. */
export default function StatTile({ label, value, footnote, children, loading, icon }) {
  return (
    <div className={`${cardClass} flex min-w-0 flex-col`}>
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {icon}
      </div>
      <div className="mt-auto" />
      {loading ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      ) : (
        <>
          {value !== undefined && (
            <p className="mt-2 truncate text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          )}
          {children}
          {footnote && <p className="mt-1 truncate text-xs text-slate-500">{footnote}</p>}
        </>
      )}
    </div>
  );
}
