import { unwrap } from '../lib/errors.js';
import { addDays, serverToday } from '../lib/dates.js';

const RECURRING_SELECT = `
  id, amount, description, frequency, start_date, next_due_date, is_active, created_at, updated_at,
  category:categories (id, name, icon, color),
  subcategory:subcategories (id, name)
`;

const todayOf = (req) => req.valid.query?.today ?? serverToday();

/** First schedule date on or after `today`. */
const nextDue = async (db, start, frequency, today) =>
  unwrap(
    await db.rpc('next_occurrence', {
      p_start: start,
      p_freq: frequency,
      p_after: addDays(today, -1),
    }),
  );

/** Logs this user's bills that are due by `today`. Returns how many expenses were added. */
const logDue = async (db, today) =>
  unwrap(await db.rpc('log_my_due_recurring', { p_today: today }));

const getOne = async (db, id) =>
  unwrap(await db.from('recurring_expenses').select(RECURRING_SELECT).eq('id', id).single());

export async function listRecurring(req, res) {
  const data = unwrap(
    await req.supabase
      .from('recurring_expenses')
      .select(RECURRING_SELECT)
      .order('is_active', { ascending: false })
      .order('next_due_date', { ascending: true })
      .order('created_at', { ascending: true }),
  );
  res.json({ data });
}

export async function createRecurring(req, res) {
  const db = req.supabase;
  const today = todayOf(req);
  const body = req.valid.body;

  const { id } = unwrap(
    await db
      .from('recurring_expenses')
      .insert({
        ...body,
        user_id: req.user.id,
        next_due_date: await nextDue(db, body.start_date, body.frequency, today),
      })
      .select('id')
      .single(),
  );

  const logged = await logDue(db, today); // a bill due today shows up right away
  res.status(201).json({ data: await getOne(db, id), logged });
}

export async function updateRecurring(req, res) {
  const db = req.supabase;
  const { id } = req.valid.params;
  const today = todayOf(req);
  const changes = { ...req.valid.body };

  const current = unwrap(
    await db
      .from('recurring_expenses')
      .select('start_date, frequency, is_active')
      .eq('id', id)
      .single(),
  );

  // Changing category without naming a subcategory clears the old one (it would no longer match).
  if (changes.category_id && !('subcategory_id' in changes)) changes.subcategory_id = null;

  // New schedule, or resuming after a pause: restart from today (paused weeks are not back-filled).
  const resumed = changes.is_active === true && !current.is_active;
  if ('start_date' in changes || 'frequency' in changes || resumed) {
    changes.next_due_date = await nextDue(
      db,
      changes.start_date ?? current.start_date,
      changes.frequency ?? current.frequency,
      today,
    );
  }

  unwrap(await db.from('recurring_expenses').update(changes).eq('id', id).select('id').single());
  const logged = await logDue(db, today);
  res.json({ data: await getOne(db, id), logged });
}

export async function deleteRecurring(req, res) {
  // Expenses it already logged stay; their recurring_id is set to null.
  unwrap(
    await req.supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', req.valid.params.id)
      .select('id')
      .single(),
  );
  res.status(204).end();
}

/** Called by the app on load: logs any bills due by the user's local today. */
export async function runDue(req, res) {
  res.json({ logged: await logDue(req.supabase, todayOf(req)) });
}
