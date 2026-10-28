import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, previousRange } from '../../src/lib/dates.js';

describe('date helpers', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts days inclusively', () => {
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(31);
    expect(daysBetween('2026-10-05', '2026-10-05')).toBe(1);
  });
});

describe('previousRange', () => {
  it.each([
    ['one month', '2026-10-01', '2026-10-31', '2026-09-01', '2026-09-30'],
    ['three months', '2026-08-01', '2026-10-31', '2026-05-01', '2026-07-31'],
    ['a year', '2026-01-01', '2026-12-31', '2025-01-01', '2025-12-31'],
    ['March (short Feb before it)', '2026-03-01', '2026-03-31', '2026-02-01', '2026-02-28'],
    ['a 7-day custom range', '2026-10-05', '2026-10-11', '2026-09-28', '2026-10-04'],
  ])('%s', (_name, from, to, pFrom, pTo) => {
    expect(previousRange(from, to)).toEqual({ from: pFrom, to: pTo });
  });

  it('is null for open ranges', () => {
    expect(previousRange(undefined, '2026-10-11')).toBeNull();
    expect(previousRange('2026-10-01', undefined)).toBeNull();
  });
});
