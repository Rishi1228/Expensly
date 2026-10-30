// Shared setup for tests that run against the real Supabase project.
// Run with `npm run test:db -w server` (reads server/.env). Each file creates its own
// throwaway users and deletes them (and, by cascade, all their rows) afterwards.
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../../src/app.js';

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('DB tests need SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
export const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, opts);
export const anonClient = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
export const userClient = (token) =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...opts,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

/** Starts the API on a random port and gives back helpers bound to it. */
export function setup(prefix) {
  process.env.NODE_ENV = 'test';
  const stamp = Date.now();
  const userIds = [];
  let server;
  let base;

  async function start() {
    server = createApp().listen(0);
    base = `http://localhost:${server.address().port}/api`;
  }

  async function makeUser(label) {
    const email = `${prefix}-${label}-${stamp}@example.com`;
    const password = `Pw-${stamp}-${label}!`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Test ${label}` },
    });
    if (error) throw error;
    userIds.push(data.user.id);
    const { data: s, error: signInError } = await anonClient().auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;
    return { id: data.user.id, email, token: s.session.access_token };
  }

  /** call(user, 'GET', '/expenses') → { status, body } */
  async function call(user, method, path, body) {
    const r = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(user && { Authorization: `Bearer ${user.token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, body: r.status === 204 ? null : await r.json() };
  }

  async function stop() {
    for (const id of userIds) await admin.auth.admin.deleteUser(id);
    server?.close();
  }

  return { start, stop, makeUser, call };
}
