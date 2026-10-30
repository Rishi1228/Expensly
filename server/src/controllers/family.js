import { unwrap } from '../lib/errors.js';
import { daysBetween, previousRange, serverToday } from '../lib/dates.js';

const num = (v) => Number(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;
const withShares = (rows) => {
  const sum = rows.reduce((s, r) => s + num(r.total), 0);
  return (r) => (sum ? round2((num(r.total) / sum) * 100) : 0);
};

const rpc = async (req, fn, args = {}) => unwrap(await req.supabase.rpc(fn, args));

// ---------------------------------------------------------------------------
// Management (every rule is enforced by the SQL functions; see the family migration)
// ---------------------------------------------------------------------------

/** Family, members, sent invites, and invites I've received. */
export async function getFamily(req, res) {
  res.json({ data: await rpc(req, 'get_my_family') });
}

export async function createFamily(req, res) {
  await rpc(req, 'create_family', { p_name: req.valid.body.name });
  res.status(201).json({ data: await rpc(req, 'get_my_family') });
}

export async function updateFamily(req, res) {
  const { name, members_can_view_all } = req.valid.body;
  await rpc(req, 'update_family', {
    p_name: name ?? null,
    p_members_can_view_all: members_can_view_all ?? null,
  });
  res.json({ data: await rpc(req, 'get_my_family') });
}

export async function deleteFamily(req, res) {
  await rpc(req, 'delete_family');
  res.status(204).end();
}

export async function invite(req, res) {
  const id = await rpc(req, 'invite_family_member', { p_email: req.valid.body.email });
  res.status(201).json({ data: { id } });
}

export async function cancelInvite(req, res) {
  await rpc(req, 'cancel_family_invite', { p_invite: req.valid.params.id });
  res.status(204).end();
}

export const respondInvite = (accept) => async (req, res) => {
  await rpc(req, 'respond_family_invite', { p_invite: req.valid.params.id, p_accept: accept });
  res.json({ data: await rpc(req, 'get_my_family') });
};

export async function removeMember(req, res) {
  await rpc(req, 'remove_family_member', { p_user: req.valid.params.userId });
  res.status(204).end();
}

export async function leave(req, res) {
  await rpc(req, 'leave_family');
  res.status(204).end();
}

export async function transferHead(req, res) {
  await rpc(req, 'transfer_family_head', { p_user: req.valid.body.user_id });
  res.json({ data: await rpc(req, 'get_my_family') });
}

// ---------------------------------------------------------------------------
// Analytics (same response shapes as /api/stats, plus per-member data)
// ---------------------------------------------------------------------------

const range = (q) => ({ p_from: q.from ?? null, p_to: q.to ?? null });

async function total(req, from, to, member) {
  const [row] = await rpc(req, 'family_spend_total', {
    p_from: from ?? null,
    p_to: to ?? null,
    p_member: member ?? null,
  });
  return { total: num(row?.total), count: num(row?.expense_count), first: row?.first_date };
}

async function byCategory(req, q) {
  const rows = await rpc(req, 'family_spend_by_category', {
    ...range(q),
    p_member: q.member ?? null,
  });
  const share = withShares(rows);
  return rows.map((r) => ({
    category_id: r.category_id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    total: num(r.total),
    count: num(r.expense_count),
    share: share(r),
  }));
}

export async function summary(req, res) {
  const q = req.valid.query;
  const today = q.today ?? serverToday();
  const prev = previousRange(q.from, q.to);

  const [current, previous, categories] = await Promise.all([
    total(req, q.from, q.to, q.member),
    prev ? total(req, prev.from, prev.to, q.member) : null,
    byCategory(req, q),
  ]);

  // Average per day counts only days that have happened (up to today) in the range.
  const start = q.from ?? current.first;
  const end = q.to && q.to < today ? q.to : today;
  const days = start && start <= end ? daysBetween(start, end) : 0;

  res.json({
    data: {
      from: q.from ?? null,
      to: q.to ?? null,
      member: q.member ?? null,
      total: current.total,
      count: current.count,
      avg_per_day: days ? round2(current.total / days) : 0,
      days,
      previous: prev && { ...prev, total: previous.total },
      change_pct:
        previous && previous.total > 0
          ? round2(((current.total - previous.total) / previous.total) * 100)
          : null,
      top_category: categories[0] ?? null,
    },
  });
}

/** Spend per member. Members the caller can't see are one "Other members" row (user_id null). */
export async function byMember(req, res) {
  const rows = await rpc(req, 'family_spend_by_member', range(req.valid.query));
  const share = withShares(rows);
  res.json({
    data: rows.map((r) => ({
      user_id: r.user_id,
      name: r.full_name,
      is_head: r.is_head,
      is_me: r.is_me,
      total: num(r.total),
      count: num(r.expense_count),
      share: share(r),
    })),
  });
}

export async function categoryBreakdown(req, res) {
  res.json({ data: await byCategory(req, req.valid.query) });
}

export async function subcategoryBreakdown(req, res) {
  const q = req.valid.query;
  const rows = await rpc(req, 'family_spend_by_subcategory', {
    p_category_id: q.category_id,
    ...range(q),
    p_member: q.member ?? null,
  });
  const share = withShares(rows);
  res.json({
    data: rows.map((r) => ({
      subcategory_id: r.subcategory_id,
      name: r.name,
      total: num(r.total),
      count: num(r.expense_count),
      share: share(r),
    })),
  });
}

export async function trend(req, res) {
  const q = req.valid.query;
  const today = q.today ?? serverToday();
  const granularity =
    q.granularity ?? (q.from && daysBetween(q.from, q.to ?? today) <= 92 ? 'day' : 'month');

  const rows = await rpc(req, 'family_spend_trend', {
    ...range(q),
    p_granularity: granularity,
    p_today: today,
    p_member: q.member ?? null,
  });
  res.json({
    granularity,
    data: rows.map((r) => ({ bucket: r.bucket, total: num(r.total), count: num(r.expense_count) })),
  });
}

export async function listExpenses(req, res) {
  const q = req.valid.query;
  const rows = await rpc(req, 'family_expenses', {
    ...range(q),
    p_member: q.member ?? null,
    p_category_id: q.category_id ?? null,
    p_limit: q.limit,
    p_offset: (q.page - 1) * q.limit,
  });
  res.json({
    data: rows.map(({ total_count: _total, member_name, user_id, ...e }) => ({
      ...e,
      amount: num(e.amount),
      member: { user_id, name: member_name },
    })),
    page: q.page,
    limit: q.limit,
    total: num(rows[0]?.total_count),
  });
}
