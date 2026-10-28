import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anonClient, setup } from './helpers.js';

// Fixed data and a fixed "today", so every number below is computed by hand.
const t = setup('t-stats');
const T = '&today=2026-10-28';
const OCT = `?from=2026-10-01&to=2026-10-31${T}`;
let A, B, cat;

beforeAll(async () => {
  await t.start();
  A = await t.makeUser('a');
  B = await t.makeUser('b');
  const cats = (await t.call(A, 'GET', '/categories')).body.data;
  cat = (n) => cats.find((c) => c.name === n);
  const sub = (c, s) => cat(c).subcategories.find((x) => x.name === s).id;

  const rows = [
    [1000, 'Food', null, '2026-09-10'],
    [500, 'Travel', null, '2026-09-20'],
    [400, 'Food', 'Online Order', '2026-10-05'],
    [100, 'Food', null, '2026-10-05'],
    [2100, 'Necessities', 'Electricity Bill', '2026-10-12'],
    [600, 'Travel', null, '2026-10-27'],
    [300, 'Food', 'Online Order', '2026-10-28'],
    [50, 'Food', null, '2026-10-30'], // after "today"
  ];
  for (const [amount, c, s, d] of rows) {
    const r = await t.call(A, 'POST', '/expenses', {
      amount,
      category_id: cat(c).id,
      subcategory_id: s && sub(c, s),
      expense_date: d,
    });
    if (r.status !== 201) throw new Error(JSON.stringify(r.body));
  }
});

afterAll(() => t.stop());

const get = async (user, path) => (await t.call(user, 'GET', path)).body;

describe('summary', () => {
  it('this month vs last month', async () => {
    const s = (await get(A, `/stats/summary${OCT}`)).data;
    expect(s).toMatchObject({
      total: 3550,
      count: 6,
      change_pct: 136.67,
      days: 28,
      avg_per_day: 126.79,
    });
    expect(s.previous.total).toBe(1500);
    expect([s.top_category.name, s.top_category.total, s.top_category.share]).toEqual([
      'Necessities',
      2100,
      59.15,
    ]);
  });

  it('all time has no comparison and counts days from the first expense', async () => {
    const s = (await get(A, '/stats/summary?today=2026-10-28')).data;
    expect(s).toMatchObject({
      total: 5050,
      previous: null,
      change_pct: null,
      days: 49,
      avg_per_day: 103.06,
    });
  });

  it('change % is empty when the previous period has no spend', async () => {
    const s = (await get(A, `/stats/summary?from=2026-10-05&to=2026-10-11${T}`)).data;
    expect([s.total, s.change_pct]).toEqual([500, null]);
  });
});

describe('breakdowns', () => {
  it('by category, ranked with shares', async () => {
    const rows = (await get(A, `/stats/by-category${OCT}`)).data;
    expect(rows.map((r) => [r.name, r.total, r.share])).toEqual([
      ['Necessities', 2100, 59.15],
      ['Food', 850, 23.94],
      ['Travel', 600, 16.9],
    ]);
  });

  it('by subcategory, with "Unspecified" for none', async () => {
    const rows = (await get(A, `/stats/by-subcategory${OCT}&category_id=${cat('Food').id}`)).data;
    expect(rows.map((r) => [r.name, r.total])).toEqual([
      ['Online Order', 700],
      ['Unspecified', 150],
    ]);
  });
});

describe('trend', () => {
  it('daily buckets for a month, empty days filled with 0', async () => {
    const r = await get(A, `/stats/trend${OCT}`);
    expect(r.granularity).toBe('day');
    expect([r.data.length, r.data[0].bucket, r.data.at(-1).bucket]).toEqual([
      30,
      '2026-10-01',
      '2026-10-30',
    ]);
    expect(r.data.find((d) => d.bucket === '2026-10-05').total).toBe(500);
    expect(r.data.reduce((a, d) => a + d.total, 0)).toBe(3550);
  });

  it('monthly buckets for all time', async () => {
    const r = await get(A, '/stats/trend?today=2026-10-28');
    expect(r.granularity).toBe('month');
    expect(r.data.map((d) => [d.bucket, d.total])).toEqual([
      ['2026-09-01', 1500],
      ['2026-10-01', 3550],
    ]);
  });
});

describe('validation and isolation', () => {
  it.each([
    '/stats/summary?from=2026-10-10&to=2026-10-01',
    '/stats/trend?granularity=week',
    '/stats/by-subcategory',
  ])('%s -> 400', async (path) => {
    expect((await t.call(A, 'GET', path)).status).toBe(400);
  });

  it('another user sees nothing', async () => {
    const s = (await get(B, `/stats/summary${OCT}`)).data;
    expect([s.total, s.count, s.top_category]).toEqual([0, 0, null]);
    expect((await get(B, `/stats/by-category${OCT}`)).data).toEqual([]);
  });

  it('logged-out callers cannot run the SQL functions', async () => {
    const { error } = await anonClient().rpc('spend_total', {});
    expect(error).toBeTruthy();
  });
});
