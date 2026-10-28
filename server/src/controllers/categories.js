import { HttpError, unwrap } from '../lib/errors.js';

const withFlag = (row) => ({ ...row, is_custom: row.user_id !== null });

/** Built-in + the user's own categories, each with its subcategories. */
export async function listCategories(req, res) {
  const rows = unwrap(
    await req.supabase
      .from('categories')
      .select(
        'id, name, icon, color, sort_order, user_id, subcategories (id, name, sort_order, user_id)',
      )
      .order('sort_order')
      .order('name')
      .order('sort_order', { referencedTable: 'subcategories' })
      .order('name', { referencedTable: 'subcategories' }),
  );

  const data = rows.map((c) => ({ ...withFlag(c), subcategories: c.subcategories.map(withFlag) }));
  res.json({ data });
}

export async function createCategory(req, res) {
  const row = unwrap(
    await req.supabase
      .from('categories')
      .insert({ ...req.valid.body, user_id: req.user.id })
      .select('id, name, icon, color, sort_order, user_id')
      .single(),
  );
  res.status(201).json({ data: { ...withFlag(row), subcategories: [] } });
}

export async function deleteCategory(req, res) {
  const { error } = await req.supabase
    .from('categories')
    .delete()
    .eq('id', req.valid.params.id)
    .eq('user_id', req.user.id)
    .select('id')
    .single();

  if (error?.code === '23503') {
    throw new HttpError(
      409,
      'This category has expenses or recurring bills. Move or delete them first.',
    );
  }
  if (error?.code === 'PGRST116') throw new HttpError(404, 'Custom category not found');
  unwrap({ error });
  res.status(204).end();
}

export async function createSubcategory(req, res) {
  const row = unwrap(
    await req.supabase
      .from('subcategories')
      .insert({
        category_id: req.valid.params.id,
        name: req.valid.body.name,
        user_id: req.user.id,
      })
      .select('id, name, sort_order, user_id, category_id')
      .single(),
  );
  res.status(201).json({ data: withFlag(row) });
}

export async function deleteSubcategory(req, res) {
  unwrap(
    await req.supabase
      .from('subcategories')
      .delete()
      .eq('id', req.valid.params.id)
      .eq('user_id', req.user.id)
      .select('id')
      .single(),
  );
  res.status(204).end();
}
