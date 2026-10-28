import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatDayLabel,
  formatDueLabel,
  formatMoney,
  formatSchedule,
  monthlyEquivalent,
  periodRange,
  toISODate,
} from './format.js';

describe('formatMoney', () => {
  it('uses Indian grouping and shows decimals only when needed', () => {
    expect(formatMoney(125000)).toBe('₹1,25,000');
    expect(formatMoney('349.5')).toBe('₹349.50');
    expect(formatMoney(null)).toBe('₹0');
  });
});

describe('formatSchedule', () => {
  it.each([
    ['weekly', '2026-10-26', 'Every Monday'],
    ['monthly', '2026-10-01', 'Monthly on the 1st'],
    ['monthly', '2026-10-22', 'Monthly on the 22nd'],
    ['monthly', '2026-10-13', 'Monthly on the 13th'],
    ['yearly', '2026-03-10', 'Yearly on 10 Mar'],
  ])('%s from %s', (freq, start, want) => {
    expect(formatSchedule(freq, start)).toBe(want);
  });
});

describe('monthlyEquivalent', () => {
  it('converts weekly and yearly amounts to a monthly figure', () => {
    expect(monthlyEquivalent(1200, 'yearly')).toBe(100);
    expect(monthlyEquivalent(300, 'weekly')).toBe(1300);
    expect(monthlyEquivalent('649', 'monthly')).toBe(649);
  });
});

describe('dates relative to today', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 9, 28, 10) })); // 28 Oct 2026
  afterEach(() => vi.useRealTimers());

  it('labels nearby days', () => {
    expect(formatDayLabel('2026-10-28')).toBe('Today');
    expect(formatDayLabel('2026-10-27')).toBe('Yesterday');
    expect(formatDueLabel('2026-10-29')).toBe('Tomorrow');
    expect(formatDayLabel('2025-12-25')).toMatch(/2025/);
  });

  it('builds period ranges', () => {
    expect(periodRange('this-month')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(periodRange('last-month')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(periodRange('last-3-months')).toEqual({ from: '2026-08-01', to: '2026-10-31' });
    expect(periodRange('this-year')).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    expect(periodRange('all')).toEqual({});
  });

  it('formats local dates without a UTC shift', () => {
    expect(toISODate(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
  });
});
