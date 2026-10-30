export const inputClass =
  'block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-white/[0.04] dark:text-slate-100 dark:shadow-none dark:ring-white/10 dark:placeholder:text-slate-500 dark:focus:ring-indigo-400 [color-scheme:light] dark:[color-scheme:dark]';

/** Label + control + error message. */
export default function Field({ label, htmlFor, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
