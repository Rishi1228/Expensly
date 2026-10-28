import { CircleAlert, RotateCw } from 'lucide-react';

/** Inline "couldn't load" message with a retry button, for use inside cards. */
export default function ErrorNote({ message = 'Couldn’t load this.', onRetry, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-500 ${className}`}
      role="alert"
    >
      <CircleAlert className="size-6 text-rose-500" aria-hidden />
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          className="flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
        >
          <RotateCw className="size-4" aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}
