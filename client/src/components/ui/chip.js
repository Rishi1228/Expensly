/** Classes for a pill-shaped toggle chip. */
export const chip = (active) =>
  `rounded-full px-3 py-1.5 text-sm ring-1 transition-colors ${
    active
      ? 'bg-indigo-600 text-white ring-indigo-600'
      : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'
  }`;
