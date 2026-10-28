import { unwrap } from '../lib/errors.js';
import { daysBetween, previousRange, serverToday } from '../lib/dates.js';

const num = (v) => Number(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;

async function total(db, from, to) {
  const [row] = unwrap(await db.rpc('spend_total', { p_from: from ?? null, p_to: to ?? null }));
  return { total: num(row?.total), count: num(row?.expense_count) };
}

async function byCategory(db, from, to) {
  const rows = unwrap(
    await db.rpc('spend_by_category', { p_from: from ?? null, p_to: to ?? null }),
  );
  const sum = rows.reduce((s, r) => s + num(r.total), 0);
  return rows.map((r) => ({
    category_id: r.category_id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    total: num(r.total),
    count: num(r.expense_count),
    share: sum ? round2((num(r.total) / sum) * 100) : 0,
  }));
}

/** Headline numbers for the dashboard tiles. */
export async function summary(req, res) {
  const { from, to } = req.valid.query;
  const today = req.valid.query.today ?? serverToday();
  const prev = previousRange(from, to);

  const [current, previous, categories, first] = await Promise.all([
    total(req.supabase, from, to),
    prev ? total(req.supabase, prev.from, prev.to) : null,
    byCategory(req.supabase, from, to),
    from
      ? null
      : req.supabase
          .from('expenses')
          .select('expense_date')
          .order('expense_date')
          .limit(1)
          .maybeSingle(),
  ]);

  // Average per day counts only days that have happened (up to today) in the range.
  const start = from ?? unwrap(first ?? { data: null })?.expense_date;
  const end = to && to < today ? to : today;
  const days = start && start <= end ? daysBetween(start, end) : 0;

  res.json({
    data: {
      from: from ?? null,
      to: to ?? null,
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

export async function categoryBreakdown(req, res) {
  const { from, to } = req.valid.query;
  res.json({ data: await byCategory(req.supabase, from, to) });
}

export async function subcategoryBreakdown(req, res) {
  const { from, to, category_id } = req.valid.query;
  const rows = unwrap(
    await req.supabase.rpc('spend_by_subcategory', {
      p_category_id: category_id,
      p_from: from ?? null,
      p_to: to ?? null,
    }),
  );
  const sum = rows.reduce((s, r) => s + num(r.total), 0);
  res.json({
    data: rows.map((r) => ({
      subcategory_id: r.subcategory_id,
      name: r.name,
      total: num(r.total),
      count: num(r.expense_count),
      share: sum ? round2((num(r.total) / sum) * 100) : 0,
    })),
  });
}

export async function trend(req, res) {
  const { from, to } = req.valid.query;
  const today = req.valid.query.today ?? serverToday();
  // Daily bars for ranges up to ~3 months, monthly beyond that (or for open ranges).
  const granularity =
    req.valid.query.granularity ?? (from && daysBetween(from, to ?? today) <= 92 ? 'day' : 'month');

  const rows = unwrap(
    await req.supabase.rpc('spend_trend', {
      p_from: from ?? null,
      p_to: to ?? null,
      p_granularity: granularity,
      p_today: today,
    }),
  );
  res.json({
    granularity,
    data: rows.map((r) => ({ bucket: r.bucket, total: num(r.total), count: num(r.expense_count) })),
  });
}
