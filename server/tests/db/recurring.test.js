import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDays, serverToday } from '../../src/lib/dates.js';
import { admin, anonClient, setup, userClient } from './helpers.js';

const t = setup('t-rec');
const today = serverToday();
const T = `?today=${today}`;
let A, B, ent, ott, nec;

const loggedFor = async (userId, recurringId) => {
  const { data } = await admin
    .from('expenses')
    .select('expense_date, amount')
    .eq('user_id', userId)
    .eq('recurring_id', recurringId)
    .order('expense_date');
  return data;
};
const setNextDue = (id, date) =>
  admin.from('recurring_expenses').update({ next_due_date: date }).eq('id', id);

beforeAll(async () => {
  await t.start();
  A = await t.makeUser('a');
  B = await t.makeUser('b');
  const cats = (await t.call(A, 'GET', '/categories')).body.data;
  ent = cats.find((c) => c.name === 'Entertainment');
  ott = ent.subcategories.find((s) => s.name === 'OTT').id;
  nec = cats.find((c) => c.name === 'Necessities');
});

afterAll(() => t.stop());

describe('next_occurrence (SQL)', () => {
  it.each([
    ['2026-01-31', 'monthly', '2026-01-31', '2026-02-28'], // short month
    ['2026-01-31', 'monthly', '2026-02-28', '2026-03-31'], // no drift after Feb
    ['2024-02-29', 'yearly', '2024-02-29', '2025-02-28'],
    ['2024-02-29', 'yearly', '2027-03-01', '2028-02-29'], // back to a leap day
    ['2026-10-05', 'weekly', '2026-10-27', '2026-11-02'],
    ['2026-12-01', 'monthly', '2026-10-27', '2026-12-01'], // before the start
  ])('%s %s after %s -> %s', async (start, freq, after, want) => {
    const { data, error } = await userClient(A.token).rpc('next_occurrence', {
      p_start: start,
      p_freq: freq,
      p_after: after,
    });
    expect(error).toBeNull();
    expect(data).toBe(want);
  });
});

describe('recurring bills', () => {
  let netflix, rent, weekly;

  it('validates input', async () => {
    const bad = [
      { amount: 0, category_id: ent.id, frequency: 'daily', start_date: today },
      { amount: 199, category_id: ent.id, frequency: 'monthly' },
      {
        amount: 199,
        category_id: ent.id,
        subcategory_id: nec.subcategories[0].id,
        frequency: 'monthly',
        start_date: today,
      },
    ];
    for (const body of bad)
      expect((await t.call(A, 'POST', `/recurring${T}`, body)).status).toBe(400);
  });

  it('a bill due today logs exactly one expense, and re-running adds none', async () => {
    const r = await t.call(A, 'POST', `/recurring${T}`, {
      amount: 649,
      category_id: ent.id,
      subcategory_id: ott,
      description: 'Netflix',
      frequency: 'monthly',
      start_date: today,
    });
    expect([r.status, r.body.logged]).toEqual([201, 1]);
    netflix = r.body.data;
    expect(netflix.next_due_date > today).toBe(true);

    expect((await t.call(A, 'POST', `/recurring/run${T}`)).body.logged).toBe(0);
    expect((await admin.rpc('log_due_recurring')).data).toBe(0); // the pg_cron job

    // Even with the due date forced back, the unique constraint blocks a duplicate.
    await setNextDue(netflix.id, today);
    expect((await admin.rpc('log_due_recurring', { p_today: today })).data).toBe(0);
    const rows = await loggedFor(A.id, netflix.id);
    expect(rows.map((x) => [x.expense_date, Number(x.amount)])).toEqual([[today, 649]]);
  });

  it('a future start date logs nothing yet', async () => {
    const start = addDays(today, 10);
    const r = await t.call(A, 'POST', `/recurring${T}`, {
      amount: 15000,
      category_id: nec.id,
      frequency: 'monthly',
      start_date: start,
    });
    expect([r.body.logged, r.body.data.next_due_date]).toEqual([0, start]);
    rent = r.body.data;
  });

  it('a past start date does not back-fill', async () => {
    const start = addDays(today, -20);
    const r = await t.call(A, 'POST', `/recurring${T}`, {
      amount: 300,
      category_id: nec.id,
      frequency: 'weekly',
      start_date: start,
    });
    expect([r.body.logged, r.body.data.next_due_date]).toEqual([0, addDays(start, 21)]);
    weekly = r.body.data;
  });

  it('catches up missed runs on the right dates', async () => {
    const start = weekly.start_date;
    await setNextDue(weekly.id, start);
    expect((await t.call(A, 'POST', `/recurring/run${T}`)).body.logged).toBe(3);
    const rows = await loggedFor(A.id, weekly.id);
    expect(rows.map((x) => x.expense_date)).toEqual([start, addDays(start, 7), addDays(start, 14)]);
  });

  it('lists bills by next due date', async () => {
    const list = (await t.call(A, 'GET', '/recurring')).body.data;
    const dues = list.map((x) => x.next_due_date);
    expect(dues).toHaveLength(3);
    expect(dues).toEqual([...dues].sort());
  });

  it('pausing skips the bill; resuming restarts from today without back-fill', async () => {
    const r = await t.call(A, 'PUT', `/recurring/${weekly.id}${T}`, { is_active: false });
    expect(r.body.data.is_active).toBe(false);
    await setNextDue(weekly.id, addDays(today, -1));
    expect((await admin.rpc('log_due_recurring', { p_today: today, p_user: A.id })).data).toBe(0);

    const resumed = await t.call(A, 'PUT', `/recurring/${weekly.id}${T}`, { is_active: true });
    expect(resumed.body.data.next_due_date >= today).toBe(true);
    expect(await loggedFor(A.id, weekly.id)).toHaveLength(3);
  });

  it('edits: amount keeps the schedule, schedule changes recompute it', async () => {
    let r = await t.call(A, 'PUT', `/recurring/${rent.id}${T}`, { amount: 16000 });
    expect([Number(r.body.data.amount), r.body.data.next_due_date]).toEqual([
      16000,
      rent.next_due_date,
    ]);
    r = await t.call(A, 'PUT', `/recurring/${rent.id}${T}`, {
      frequency: 'yearly',
      start_date: addDays(today, 3),
    });
    expect(r.body.data.next_due_date).toBe(addDays(today, 3));
    r = await t.call(A, 'PUT', `/recurring/${netflix.id}${T}`, { category_id: nec.id });
    expect(r.body.data.subcategory).toBeNull();
  });

  it('keeps users apart and locks down the SQL functions', async () => {
    expect((await t.call(B, 'GET', '/recurring')).body.data).toEqual([]);
    expect((await t.call(B, 'PUT', `/recurring/${rent.id}${T}`, { amount: 1 })).status).toBe(404);
    expect((await t.call(B, 'DELETE', `/recurring/${rent.id}`)).status).toBe(404);
    expect((await t.call(B, 'POST', `/recurring/run${T}`)).body.logged).toBe(0);

    const asUser = await userClient(A.token).rpc('log_due_recurring', { p_today: today });
    expect(asUser.error).toBeTruthy();
    const asAnon = await anonClient().rpc('log_my_due_recurring', { p_today: today });
    expect(asAnon.error).toBeTruthy();
    const farFuture = await t.call(A, 'POST', `/recurring/run?today=${addDays(today, 5)}`);
    expect(farFuture.status).toBe(400);
  });

  it('deleting a bill keeps the expenses it logged', async () => {
    expect((await t.call(A, 'DELETE', `/recurring/${netflix.id}`)).status).toBe(204);
    const { data } = await admin
      .from('expenses')
      .select('recurring_id')
      .eq('user_id', A.id)
      .eq('description', 'Netflix');
    expect(data).toEqual([{ recurring_id: null }]);
  });
});
