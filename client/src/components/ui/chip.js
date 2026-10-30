/** Classes for a pill-shaped toggle chip. */
export const chip = (active) =>
  `rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
    active
      ? 'bg-brand text-white shadow-glow'
      : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-slate-900 hover:ring-slate-300 dark:bg-white/5 dark:text-slate-300 dark:shadow-none dark:ring-white/10 dark:hover:text-white'
  }`;
