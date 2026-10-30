import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setup, userClient } from './helpers.js';

// Head + two members + an outsider, with fixed expenses so every number is checked by hand.
const t = setup('t-family');
const OCT = '?from=2026-10-01&to=2026-10-31&today=2026-10-28';
let head, kid, mom, outsider, cat;

const ok = (r, status = 200) => {
  if (r.status !== status) throw new Error(`${r.status} ${JSON.stringify(r.body)}`);
  return r.body;
};

beforeAll(async () => {
  await t.start();
  [head, kid, mom, outsider] = await Promise.all(['head', 'kid', 'mom', 'out'].map(t.makeUser));

  const cats = (await t.call(head, 'GET', '/categories')).body.data;
  cat = (n) => cats.find((c) => c.name === n).id;
  const rows = [
    [head, 1000, 'Food', '2026-10-05'],
    [kid, 300, 'Travel', '2026-10-06'],
    [kid, 200, 'Food', '2026-09-06'],
    [mom, 500, 'Food', '2026-10-07'],
    [outsider, 9999, 'Food', '2026-10-07'],
  ];
  for (const [u, amount, c, d] of rows) {
    ok(await t.call(u, 'POST', '/expenses', { amount, category_id: cat(c), expense_date: d }), 201);
  }
});

afterAll(() => t.stop());

const join = async (inviter, user) => {
  ok(await t.call(inviter, 'POST', '/family/invites', { email: user.email }), 201);
  const inv = ok(await t.call(user, 'GET', '/family')).data.received_invites[0];
  ok(await t.call(user, 'POST', `/family/invites/${inv.id}/accept`));
};

describe('forming a family', () => {
  it('no family yet: empty overview, family stats are 404', async () => {
    const f = ok(await t.call(kid, 'GET', '/family')).data;
    expect([f.family, f.members]).toEqual([null, []]);
    expect((await t.call(kid, 'GET', `/family/stats/summary${OCT}`)).status).toBe(404);
  });

  it('creator becomes head; a second family is a 409', async () => {
    const f = ok(await t.call(head, 'POST', '/family', { name: 'Shahs' }), 201).data;
    expect([f.family.name, f.is_head, f.family.members_can_view_all]).toEqual([
      'Shahs',
      true,
      false,
    ]);
    expect((await t.call(head, 'POST', '/family', { name: 'Again' })).status).toBe(409);
  });

  it('invites need accepting; any member can invite', async () => {
    await join(head, kid);
    await join(kid, mom); // a member, not the head, invites
    const f = ok(await t.call(head, 'GET', '/family')).data;
    expect(f.members.map((m) => [m.is_head, m.is_me])).toEqual([
      [true, true],
      [false, false],
      [false, false],
    ]);
  });

  it('rejects a duplicate invite and inviting an existing member', async () => {
    ok(await t.call(head, 'POST', '/family/invites', { email: outsider.email }), 201);
    expect((await t.call(kid, 'POST', '/family/invites', { email: outsider.email })).status).toBe(
      409,
    );
    expect((await t.call(kid, 'POST', '/family/invites', { email: mom.email })).status).toBe(409);
  });

  it('only the head or the inviter can cancel an invite', async () => {
    const inv = ok(await t.call(head, 'GET', '/family')).data.invites[0];
    expect((await t.call(kid, 'DELETE', `/family/invites/${inv.id}`)).status).toBe(403);
    expect((await t.call(head, 'DELETE', `/family/invites/${inv.id}`)).status).toBe(204);
  });
});

describe('restricted view (default)', () => {
  it('everyone sees the family total', async () => {
    const s = ok(await t.call(kid, 'GET', `/family/stats/summary${OCT}`)).data;
    expect([s.total, s.count, s.previous.total]).toEqual([1800, 3, 200]);
  });

  it('a member sees self + "Other members"; the head sees everyone', async () => {
    const forKid = ok(await t.call(kid, 'GET', `/family/stats/by-member${OCT}`)).data;
    expect(forKid.map((r) => [r.user_id === null ? 'others' : r.is_me, r.total])).toEqual([
      ['others', 1500],
      [true, 300],
    ]);
    const forHead = ok(await t.call(head, 'GET', `/family/stats/by-member${OCT}`)).data;
    expect(forHead.map((r) => r.total)).toEqual([1000, 500, 300]);
  });

  it("a member can't open another member's numbers or expenses", async () => {
    expect((await t.call(kid, 'GET', `/family/stats/summary${OCT}&member=${mom.id}`)).status).toBe(
      403,
    );
    const r = ok(await t.call(kid, 'GET', '/family/expenses'));
    expect(r.data.every((e) => e.member.user_id === kid.id)).toBe(true);
    expect(r.total).toBe(2);
  });

  it('the head can filter to one member', async () => {
    const s = ok(await t.call(head, 'GET', `/family/stats/summary${OCT}&member=${mom.id}`)).data;
    expect(s.total).toBe(500);
    const c = ok(await t.call(head, 'GET', `/family/stats/by-category${OCT}`)).data;
    expect(c.map((x) => [x.name, x.total])).toEqual([
      ['Food', 1500],
      ['Travel', 300],
    ]);
  });

  it('the outsider is never included, and personal RLS is unchanged', async () => {
    const r = ok(await t.call(head, 'GET', '/family/expenses?limit=100'));
    expect(r.data.some((e) => e.member.user_id === outsider.id)).toBe(false);
    const { data } = await userClient(kid.token).from('expenses').select('user_id');
    expect(data.every((e) => e.user_id === kid.id)).toBe(true);
  });
});

describe('head-only rules', () => {
  it('members cannot remove, change settings or transfer', async () => {
    expect((await t.call(kid, 'DELETE', `/family/members/${mom.id}`)).status).toBe(403);
    expect((await t.call(kid, 'PUT', '/family', { members_can_view_all: true })).status).toBe(403);
    expect((await t.call(kid, 'POST', '/family/transfer', { user_id: kid.id })).status).toBe(403);
  });

  it('members cannot write the family tables directly', async () => {
    const f = ok(await t.call(head, 'GET', '/family')).data.family;
    const { error } = await userClient(outsider.token)
      .from('family_members')
      .insert({ family_id: f.id, user_id: outsider.id });
    expect(error).not.toBeNull();
  });

  it('opening the view lets members see each other', async () => {
    ok(await t.call(head, 'PUT', '/family', { members_can_view_all: true }));
    const s = ok(await t.call(kid, 'GET', `/family/stats/summary${OCT}&member=${mom.id}`)).data;
    expect(s.total).toBe(500);
    expect(ok(await t.call(kid, 'GET', '/family/expenses')).total).toBe(4);
  });

  it('the head cannot leave while others remain, but can hand over', async () => {
    expect((await t.call(head, 'POST', '/family/leave')).status).toBe(400);
    ok(await t.call(head, 'POST', '/family/transfer', { user_id: mom.id }));
    expect((await t.call(head, 'DELETE', `/family/members/${kid.id}`)).status).toBe(403);
    expect((await t.call(mom, 'DELETE', `/family/members/${kid.id}`)).status).toBe(204);
    expect((await t.call(head, 'POST', '/family/leave')).status).toBe(204);
  });

  it('deleting the family removes it for everyone', async () => {
    expect((await t.call(mom, 'DELETE', '/family')).status).toBe(204);
    expect(ok(await t.call(mom, 'GET', '/family')).data.family).toBeNull();
  });
});
