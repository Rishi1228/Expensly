import { describe, expect, it } from 'vitest';
import { createExpense, listExpensesQuery, updateExpense } from '../../src/schemas/expenses.js';
import { createRecurring, updateRecurring } from '../../src/schemas/recurring.js';
import { createCategory } from '../../src/schemas/categories.js';
import {
  createFamily,
  familyExpensesQuery,
  familyRangeQuery,
  inviteBody,
  updateFamily,
} from '../../src/schemas/family.js';

const CAT = '0b6c5c0e-3c51-4c4a-9d1f-1f2b3c4d5e6f';

describe('expense schemas', () => {
  it('accepts a minimal expense and rounds the amount to 2 decimals', () => {
    expect(createExpense.parse({ amount: '12.345', category_id: CAT }).amount).toBe(12.35);
  });

  it('trims text and turns an empty description into null', () => {
    const blank = createExpense.parse({ amount: 1, category_id: CAT, description: '   ' });
    const tea = createExpense.parse({ amount: 1, category_id: CAT, description: ' tea ' });
    expect(blank.description).toBeNull();
    expect(tea.description).toBe('tea');
  });

  it.each([
    ['zero amount', { amount: 0, category_id: CAT }],
    ['negative amount', { amount: -5, category_id: CAT }],
    ['non-numeric amount', { amount: 'abc', category_id: CAT }],
    ['missing category', { amount: 10 }],
    ['bad category id', { amount: 10, category_id: 'nope' }],
    ['bad date format', { amount: 10, category_id: CAT, expense_date: '28-10-2026' }],
    ['description too long', { amount: 10, category_id: CAT, description: 'x'.repeat(501) }],
  ])('rejects %s', (_name, input) => {
    expect(createExpense.safeParse(input).success).toBe(false);
  });

  it('rejects an empty update', () => {
    expect(updateExpense.safeParse({}).success).toBe(false);
  });

  it('applies list defaults and rejects bad ranges and limits', () => {
    expect(listExpensesQuery.parse({})).toMatchObject({ page: 1, limit: 20 });
    expect(listExpensesQuery.safeParse({ from: '2026-10-10', to: '2026-10-01' }).success).toBe(
      false,
    );
    expect(listExpensesQuery.safeParse({ limit: '500' }).success).toBe(false);
  });
});

describe('recurring schemas', () => {
  const base = { amount: 649, category_id: CAT, frequency: 'monthly', start_date: '2026-10-28' };

  it('accepts a valid bill', () => {
    expect(createRecurring.safeParse(base).success).toBe(true);
  });

  it('requires a known frequency and a start date', () => {
    expect(createRecurring.safeParse({ ...base, frequency: 'daily' }).success).toBe(false);
    expect(createRecurring.safeParse({ ...base, start_date: undefined }).success).toBe(false);
  });

  it('allows pausing via update but not an empty update', () => {
    expect(updateRecurring.safeParse({ is_active: false }).success).toBe(true);
    expect(updateRecurring.safeParse({}).success).toBe(false);
  });
});

describe('category schema', () => {
  it('needs a name and a hex color', () => {
    expect(createCategory.safeParse({ name: 'Pets', color: '#f97316' }).success).toBe(true);
    expect(createCategory.safeParse({ name: '  ' }).success).toBe(false);
    expect(createCategory.safeParse({ name: 'Pets', color: 'orange' }).success).toBe(false);
  });
});

describe('family schemas', () => {
  it('normalises an invite email', () => {
    expect(inviteBody.parse({ email: '  Mom@Example.COM ' }).email).toBe('mom@example.com');
  });

  it.each([{}, { email: 'not-an-email' }])('rejects invite %o', (body) => {
    expect(inviteBody.safeParse(body).success).toBe(false);
  });

  it('needs a family name and something to update', () => {
    expect(createFamily.safeParse({ name: '  ' }).success).toBe(false);
    expect(updateFamily.safeParse({}).success).toBe(false);
    expect(updateFamily.parse({ members_can_view_all: true })).toEqual({
      members_can_view_all: true,
    });
  });

  it('family stats take an optional member and still check the range', () => {
    expect(familyRangeQuery.parse({ member: CAT }).member).toBe(CAT);
    expect(familyRangeQuery.safeParse({ member: 'x' }).success).toBe(false);
    expect(familyRangeQuery.safeParse({ from: '2026-10-02', to: '2026-10-01' }).success).toBe(
      false,
    );
  });

  it('family expenses page defaults', () => {
    expect(familyExpensesQuery.parse({})).toMatchObject({ page: 1, limit: 20 });
  });
});
