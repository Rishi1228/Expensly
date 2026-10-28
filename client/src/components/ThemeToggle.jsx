import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme.js';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/** Icon button that flips between light and dark. */
export function ThemeButton({ className = '' }) {
  const [, setTheme, isDark] = useTheme();
  const Icon = isDark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

/** Light / Dark / System segmented control (Profile page). */
export default function ThemeSelect() {
  const [theme, setTheme] = useTheme();
  return (
    <div
      className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            theme === value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Icon className="size-4" aria-hidden /> {label}
        </button>
      ))}
    </div>
  );
}
