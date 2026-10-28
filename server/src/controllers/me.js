import { unwrap } from '../lib/errors.js';

export async function getMe(req, res) {
  const profile = unwrap(
    await req.supabase
      .from('profiles')
      .select('id, full_name, currency, created_at')
      .eq('id', req.user.id)
      .maybeSingle(),
  );
  res.json({ data: { id: req.user.id, email: req.user.email, profile } });
}
