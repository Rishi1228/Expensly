import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeSelect, { ThemeButton } from '../components/ThemeToggle.jsx';
import { getTheme, setTheme } from './theme.js';

const isDark = () => document.documentElement.classList.contains('dark');

describe('theme', () => {
  it('saves light/dark and forgets the choice for system', () => {
    setTheme('dark');
    expect([getTheme(), isDark()]).toEqual(['dark', true]);
    setTheme('light');
    expect([getTheme(), isDark()]).toEqual(['light', false]);
    setTheme('system'); // matchMedia is mocked as a light OS
    expect([localStorage.getItem('theme'), isDark()]).toEqual([null, false]);
  });

  it('the Profile control and header button stay in sync', async () => {
    render(
      <>
        <ThemeSelect />
        <ThemeButton />
      </>,
    );
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(isDark()).toBe(true);
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(isDark()).toBe(false);
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
  });
});
