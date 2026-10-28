// Theme: 'light' | 'dark' | 'system'. Stored per browser; index.html applies it before first paint.
import { useEffect, useState } from 'react';

const KEY = 'theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function getTheme() {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
}

function apply(theme) {
  const dark = theme === 'dark' || (theme === 'system' && media().matches);
  document.documentElement.classList.toggle('dark', dark);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#020617' : '#f8fafc');
}

export function setTheme(theme) {
  try {
    if (theme === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // storage blocked: the choice still applies for this visit
  }
  apply(theme);
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

/** [theme, setTheme, isDark] — follows the OS setting while theme is 'system'. */
export function useTheme() {
  const [theme, setState] = useState(getTheme);
  const [isDark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const sync = () => {
      const t = getTheme();
      apply(t);
      setState(t);
      setDark(document.documentElement.classList.contains('dark'));
    };
    const onOs = () => getTheme() === 'system' && sync();
    window.addEventListener('themechange', sync);
    media().addEventListener('change', onOs);
    return () => {
      window.removeEventListener('themechange', sync);
      media().removeEventListener('change', onOs);
    };
  }, []);

  return [theme, setTheme, isDark];
}
