import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, anonClient, setup, userClient } from './helpers.js';

const t = setup('t-exp');
let A, B, cats, food, groceries, online, zepto;

beforeAll(async () => {
  await t.start();
  A = await t.makeUser('a');
  B = await t.makeUser('b');
  cats = (await t.call(A, 'GET', '/categories')).body.data;
  food = cats.find((c) => c.name === 'Food');
  groceries = cats.find((c) => c.name === 'Groceries');
  online = food.subcategories.find((s) => s.name === 'Online Order');
  zepto = groceries.subcategories.find((s) => s.name === 'Zepto');
});

afterAll(async () => {
  const ids = [A?.id, B?.id].filter(Boolean);
  await t.stop();
  const { count } = await admin
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .in('user_id', ids);
  expect(count ?? 0).toBe(0); // deleting a user removes all their rows
});

describe('signup defaults', () => {
  it('creates a profile with the signup name', async () => {
    const r = await t.call(A, 'GET', '/me');
    expect(r.body.data.profile.full_name).toBe('Test a');
  });

  it('seeds 14 default categories with 46 subcategories, in order', () => {
    expect(cats).toHaveLength(14);
    expect(cats.reduce((n, c) => n + c.subcategories.length, 0)).toBe(46);
    expect([cats[0].name, cats[13].name]).toEqual(['Food', 'Miscellaneous']);
  });
});

describe('expenses', () => {
  let e1, e2;

  it('creates with joined category and subcategory', async () => {
    const r = await t.call(A, 'POST', '/expenses', {
      amount: 349.5,
      category_id: food.id,
      subcategory_id: online.id,
      description: 'Swiggy biryani',
      expense_date: '2026-10-20',
    });
    expect(r.status).toBe(201);
    expect([r.body.data.category.name, r.body.data.subcategory.name]).toEqual([
      'Food',
      'Online Order',
    ]);
    e1 = r.body.data;
  });

  it('creates without subcategory or description', async () => {
    const r = await t.call(A, 'POST', '/expenses', {
      amount: 120,
      category_id: groceries.id,
      expense_date: '2026-10-25',
    });
    expect(r.status).toBe(201);
    expect([r.body.data.subcategory, r.body.data.description]).toEqual([null, null]);
    e2 = r.body.data;
    await t.call(A, 'POST', '/expenses', {
      amount: 80,
      category_id: food.id,
      description: '100% street momos_',
    });
  });

  it('rejects a subcategory from another category', async () => {
    const r = await t.call(A, 'POST', '/expenses', {
      amount: 10,
      category_id: food.id,
      subcategory_id: zepto.id,
    });
    expect(r.status).toBe(400);
  });

  it('returns field details for an invalid body', async () => {
    const r = await t.call(A, 'POST', '/expenses', { amount: 0 });
    expect(r.status).toBe(400);
    expect(r.body.details).toHaveLength(2);
  });

  it('paginates and filters', async () => {
    let r = await t.call(A, 'GET', '/expenses?limit=2');
    expect([r.body.data.length, r.body.total]).toEqual([2, 3]);
    r = await t.call(A, 'GET', `/expenses?category_id=${food.id}`);
    expect(r.body.total).toBe(2);
    r = await t.call(A, 'GET', '/expenses?from=2026-10-19&to=2026-10-21');
    expect(r.body.data.map((e) => e.id)).toEqual([e1.id]);
    r = await t.call(A, 'GET', '/expenses?search=biryani');
    expect(r.body.total).toBe(1);
    r = await t.call(A, 'GET', '/expenses?search=100%25'); // % is matched literally
    expect(r.body.total).toBe(1);
  });

  it('updates, and clears the subcategory when the category changes', async () => {
    let r = await t.call(A, 'PUT', `/expenses/${e1.id}`, { amount: 400 });
    expect([Number(r.body.data.amount), r.body.data.subcategory?.name]).toEqual([
      400,
      'Online Order',
    ]);
    r = await t.call(A, 'PUT', `/expenses/${e1.id}`, { category_id: groceries.id });
    expect(r.body.data.subcategory).toBeNull();
  });

  it('keeps users apart', async () => {
    expect((await t.call(B, 'GET', '/expenses')).body.total).toBe(0);
    expect((await t.call(B, 'GET', `/expenses/${e1.id}`)).status).toBe(404);
    expect((await t.call(B, 'PUT', `/expenses/${e1.id}`, { amount: 1 })).status).toBe(404);
    expect((await t.call(B, 'DELETE', `/expenses/${e1.id}`)).status).toBe(404);
    const { data } = await userClient(B.token).from('expenses').select('id');
    expect(data).toEqual([]);
    const anon = await anonClient().from('expenses').select('id');
    expect(Boolean(anon.error) || anon.data.length === 0).toBe(true);
  });

  it('deletes', async () => {
    expect((await t.call(A, 'DELETE', `/expenses/${e2.id}`)).status).toBe(204);
    expect((await t.call(A, 'GET', `/expenses/${e2.id}`)).status).toBe(404);
  });
});

describe('custom categories', () => {
  let pets, canteen;

  it('creates a private custom category; names are unique per user', async () => {
    let r = await t.call(B, 'POST', '/categories', { name: 'Pets', color: '#10b981' });
    expect([r.status, r.body.data.is_custom]).toEqual([201, true]);
    pets = r.body.data;
    r = await t.call(B, 'POST', '/categories', { name: 'pets' });
    expect(r.status).toBe(409);
    r = await t.call(A, 'GET', '/categories');
    expect(r.body.data.some((c) => c.id === pets.id)).toBe(false);
    r = await t.call(A, 'POST', '/expenses', { amount: 5, category_id: pets.id });
    expect(r.status).toBe(400);
  });

  it('adds a private subcategory under a default category', async () => {
    let r = await t.call(A, 'POST', `/categories/${food.id}/subcategories`, {
      name: 'Office Canteen',
    });
    expect([r.status, r.body.data.is_custom]).toEqual([201, true]);
    canteen = r.body.data;
    r = await t.call(B, 'GET', '/categories');
    const bFood = r.body.data.find((c) => c.id === food.id);
    expect(bFood.subcategories.some((s) => s.id === canteen.id)).toBe(false);
  });

  it('protects default and in-use categories', async () => {
    expect((await t.call(A, 'DELETE', `/categories/${food.id}`)).status).toBe(404);
    await t.call(B, 'POST', '/expenses', { amount: 999, category_id: pets.id });
    expect((await t.call(B, 'DELETE', `/categories/${pets.id}`)).status).toBe(409);
  });

  it('deletes an own subcategory', async () => {
    expect((await t.call(A, 'DELETE', `/subcategories/${canteen.id}`)).status).toBe(204);
  });
});
