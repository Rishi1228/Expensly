import { unwrap } from '../lib/errors.js';

export const EXPENSE_SELECT = `
  id, amount, description, expense_date, recurring_id, created_at, updated_at,
  category:categories (id, name, icon, color),
  subcategory:subcategories (id, name)
`;

/** Escapes LIKE wildcards so user search text is matched literally. */
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function listExpenses(req, res) {
  const { from, to, category_id, subcategory_id, search, page, limit } = req.valid.query;
  const start = (page - 1) * limit;

  let query = req.supabase
    .from('expenses')
    .select(EXPENSE_SELECT, { count: 'exact' })
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(start, start + limit - 1);

  if (from) query = query.gte('expense_date', from);
  if (to) query = query.lte('expense_date', to);
  if (category_id) query = query.eq('category_id', category_id);
  if (subcategory_id) query = query.eq('subcategory_id', subcategory_id);
  if (search) query = query.ilike('description', `%${escapeLike(search)}%`);

  const { data, error, count } = await query;
  unwrap({ data, error });
  res.json({ data, page, limit, total: count ?? 0 });
}

export async function getExpense(req, res) {
  const data = unwrap(
    await req.supabase
      .from('expenses')
      .select(EXPENSE_SELECT)
      .eq('id', req.valid.params.id)
      .single(),
  );
  res.json({ data });
}

export async function createExpense(req, res) {
  const data = unwrap(
    await req.supabase
      .from('expenses')
      .insert({ ...req.valid.body, user_id: req.user.id })
      .select(EXPENSE_SELECT)
      .single(),
  );
  res.status(201).json({ data });
}

export async function updateExpense(req, res) {
  const changes = { ...req.valid.body };
  // Changing category without naming a subcategory clears the old one (it would no longer match).
  if (changes.category_id && !('subcategory_id' in changes)) changes.subcategory_id = null;

  const data = unwrap(
    await req.supabase
      .from('expenses')
      .update(changes)
      .eq('id', req.valid.params.id)
      .select(EXPENSE_SELECT)
      .single(),
  );
  res.json({ data });
}

export async function deleteExpense(req, res) {
  unwrap(
    await req.supabase
      .from('expenses')
      .delete()
      .eq('id', req.valid.params.id)
      .select('id')
      .single(),
  );
  res.status(204).end();
}
